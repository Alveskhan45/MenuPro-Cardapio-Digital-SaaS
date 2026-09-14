import { Router, type IRouter } from "express";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import {
  CreateCategoryBody,
  CreateProductBody,
  CreatePublicOrderBody,
  CreatePublicOrderParams,
  DeleteCategoryParams,
  DeleteProductParams,
  GetPublicMenuParams,
  GetRestaurantResponse,
  GetDashboardSummaryResponse,
  ListCategoriesResponse,
  ListCustomersQueryParams,
  ListCustomersResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  UpdateCategoryBody,
  UpdateCategoryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateProductBody,
  UpdateProductParams,
  UpdateRestaurantBody,
  UpdateRestaurantResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  categoriesTable,
  customersTable,
  ordersTable,
  productsTable,
  restaurantsTable,
  type Addon,
  type AddonGroup,
  type OrderItemData,
} from "@workspace/db";

const router: IRouter = Router();
const DEMO_RESTAURANT_ID = 1;

function normalizeRestaurant(restaurant: typeof restaurantsTable.$inferSelect) {
  return {
    ...restaurant,
    logoUrl: restaurant.logoUrl ?? null,
    bannerUrl: restaurant.bannerUrl ?? null,
  };
}

async function getRestaurant(id = DEMO_RESTAURANT_ID) {
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, id))
    .limit(1);
  if (!restaurant) throw new Error("Restaurant not found");
  return restaurant;
}

async function getProductView(productId: number) {
  const [product] = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      promotionalPrice: productsTable.promotionalPrice,
      imageUrl: productsTable.imageUrl,
      isActive: productsTable.isActive,
      isFeatured: productsTable.isFeatured,
      available: productsTable.available,
      position: productsTable.position,
      addonGroups: productsTable.addonGroups,
    })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, DEMO_RESTAURANT_ID)))
    .limit(1);
  return product;
}

function normalizeOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    time: order.time.toISOString(),
    address: order.address ?? null,
    note: order.note ?? null,
  };
}

function whatsappLink(phone: string, message: string) {
  const normalized = phone.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

router.get("/restaurant", async (_req, res) => {
  const restaurant = await getRestaurant();
  return res.json(GetRestaurantResponse.parse(normalizeRestaurant(restaurant)));
});

router.patch("/restaurant", async (req, res) => {
  const input = UpdateRestaurantBody.parse(req.body);
  const [restaurant] = await db
    .update(restaurantsTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(restaurantsTable.id, DEMO_RESTAURANT_ID))
    .returning();
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  return res.json(UpdateRestaurantResponse.parse(normalizeRestaurant(restaurant)));
});

router.get("/dashboard/summary", async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, DEMO_RESTAURANT_ID));
  const allOrders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.restaurantId, DEMO_RESTAURANT_ID))
    .orderBy(desc(ordersTable.time));
  const [productTotal] = await db
    .select({ value: count(productsTable.id) })
    .from(productsTable)
    .where(eq(productsTable.restaurantId, DEMO_RESTAURANT_ID));
  const [customerTotal] = await db
    .select({ value: count(customersTable.id) })
    .from(customersTable)
    .where(eq(customersTable.restaurantId, DEMO_RESTAURANT_ID));
  const todayOrders = allOrders.filter((order) => order.time >= today);
  const pendingStatuses = new Set(["new", "confirmed", "preparing", "ready", "delivering"]);
  const topMap = new Map<number, { id: number; name: string; quantity: number; revenue: number; imageUrl: string | null }>();
  for (const order of allOrders) {
    for (const item of order.items) {
      const existing = topMap.get(item.productId ?? 0) ?? {
        id: item.productId ?? 0,
        name: item.name,
        quantity: 0,
        revenue: 0,
        imageUrl: item.imageUrl ?? null,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      topMap.set(existing.id, existing);
    }
  }
  const weeklySales = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      value: allOrders
        .filter((order) => order.time.toISOString().slice(0, 10) === key && order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total), 0),
    };
  });
  const summary = {
    ordersToday: todayOrders.length,
    salesToday: todayOrders.reduce((sum, order) => sum + Number(order.total), 0),
    pendingOrders: allOrders.filter((order) => pendingStatuses.has(order.status)).length,
    productsCount: Number(productTotal?.value ?? 0),
    customersCount: Number(customerTotal?.value ?? 0),
    menuViews: restaurant?.menuViews ?? 0,
    weeklySales,
    recentOrders: allOrders.slice(0, 5).map(normalizeOrder),
    topProducts: Array.from(topMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
  return res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/categories", async (_req, res) => {
  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      description: categoriesTable.description,
      imageUrl: categoriesTable.imageUrl,
      isActive: categoriesTable.isActive,
      position: categoriesTable.position,
      productCount: count(productsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.restaurantId, DEMO_RESTAURANT_ID))
    .groupBy(categoriesTable.id)
    .orderBy(asc(categoriesTable.position));
  return res.json(ListCategoriesResponse.parse(categories.map((category) => ({ ...category, productCount: Number(category.productCount) }))));
});

router.post("/categories", async (req, res) => {
  const input = CreateCategoryBody.parse(req.body);
  const [category] = await db
    .insert(categoriesTable)
    .values({ ...input, restaurantId: DEMO_RESTAURANT_ID })
    .returning();
  return res.status(201).json({
    ...category,
    productCount: 0,
    imageUrl: category.imageUrl ?? null,
  });
});

router.patch("/categories/:categoryId", async (req, res) => {
  const { categoryId } = UpdateCategoryParams.parse(req.params);
  const input = UpdateCategoryBody.parse(req.body);
  const [category] = await db
    .update(categoriesTable)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(categoriesTable.id, categoryId), eq(categoriesTable.restaurantId, DEMO_RESTAURANT_ID)))
    .returning();
  if (!category) return res.status(404).json({ error: "Category not found" });
  const [productTotal] = await db.select({ value: count(productsTable.id) }).from(productsTable).where(eq(productsTable.categoryId, categoryId));
  return res.json({ ...category, productCount: Number(productTotal?.value ?? 0), imageUrl: category.imageUrl ?? null });
});

router.delete("/categories/:categoryId", async (req, res) => {
  const { categoryId } = DeleteCategoryParams.parse(req.params);
  const [category] = await db
    .delete(categoriesTable)
    .where(and(eq(categoriesTable.id, categoryId), eq(categoriesTable.restaurantId, DEMO_RESTAURANT_ID)))
    .returning({ id: categoriesTable.id });
  if (!category) return res.status(404).json({ error: "Category not found" });
  return res.status(204).send();
});

router.get("/products", async (req, res) => {
  const query = ListProductsQueryParams.parse(req.query);
  const conditions = [eq(productsTable.restaurantId, DEMO_RESTAURANT_ID)];
  if (query.categoryId) conditions.push(eq(productsTable.categoryId, query.categoryId));
  if (query.status === "active") conditions.push(eq(productsTable.isActive, true));
  if (query.status === "inactive") conditions.push(eq(productsTable.isActive, false));
  if (query.search) {
    conditions.push(or(ilike(productsTable.name, `%${query.search}%`), ilike(productsTable.description, `%${query.search}%`))!);
  }
  const products = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      promotionalPrice: productsTable.promotionalPrice,
      imageUrl: productsTable.imageUrl,
      isActive: productsTable.isActive,
      isFeatured: productsTable.isFeatured,
      available: productsTable.available,
      position: productsTable.position,
      addonGroups: productsTable.addonGroups,
    })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(...conditions))
    .orderBy(asc(productsTable.position), asc(productsTable.id));
  return res.json(ListProductsResponse.parse(products.map((product) => ({ ...product, imageUrl: product.imageUrl ?? null, promotionalPrice: product.promotionalPrice ?? null }))));
});

router.post("/products", async (req, res) => {
  const input = CreateProductBody.parse(req.body);
  const [product] = await db
    .insert(productsTable)
    .values({
      ...input,
      restaurantId: DEMO_RESTAURANT_ID,
      addonGroups: [],
      promotionalPrice: input.promotionalPrice ?? null,
      imageUrl: input.imageUrl ?? null,
    })
    .returning();
  const view = await getProductView(product.id);
  return res.status(201).json(view);
});

router.patch("/products/:productId", async (req, res) => {
  const { productId } = UpdateProductParams.parse(req.params);
  const input = UpdateProductBody.parse(req.body);
  const [product] = await db
    .update(productsTable)
    .set({ ...input, updatedAt: new Date(), promotionalPrice: input.promotionalPrice ?? null, imageUrl: input.imageUrl ?? null })
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, DEMO_RESTAURANT_ID)))
    .returning();
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.json(await getProductView(product.id));
});

router.delete("/products/:productId", async (req, res) => {
  const { productId } = DeleteProductParams.parse(req.params);
  const [product] = await db
    .delete(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.restaurantId, DEMO_RESTAURANT_ID)))
    .returning({ id: productsTable.id });
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.status(204).send();
});

router.get("/orders", async (req, res) => {
  const query = ListOrdersQueryParams.parse(req.query);
  const conditions = [eq(ordersTable.restaurantId, DEMO_RESTAURANT_ID)];
  if (query.status && query.status !== "all") conditions.push(eq(ordersTable.status, query.status));
  const orders = await db
    .select()
    .from(ordersTable)
    .where(and(...conditions))
    .orderBy(desc(ordersTable.time))
    .limit(query.limit ?? 100);
  return res.json(ListOrdersResponse.parse(orders.map(normalizeOrder)));
});

router.patch("/orders/:orderId/status", async (req, res) => {
  const { orderId } = UpdateOrderStatusParams.parse(req.params);
  const { status } = UpdateOrderStatusBody.parse(req.body);
  const [order] = await db
    .update(ordersTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.restaurantId, DEMO_RESTAURANT_ID)))
    .returning();
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(normalizeOrder(order));
});

router.get("/customers", async (req, res) => {
  const query = ListCustomersQueryParams.parse(req.query);
  const conditions = [eq(customersTable.restaurantId, DEMO_RESTAURANT_ID)];
  if (query.search) conditions.push(or(ilike(customersTable.name, `%${query.search}%`), ilike(customersTable.whatsapp, `%${query.search}%`))!);
  const customers = await db
    .select()
    .from(customersTable)
    .where(and(...conditions))
    .orderBy(desc(customersTable.lastOrderAt));
  return res.json(ListCustomersResponse.parse(customers.map((customer) => ({ ...customer, lastOrderAt: customer.lastOrderAt.toISOString() }))));
});

router.get("/menu/:slug", async (req, res) => {
  const { slug } = GetPublicMenuParams.parse(req.params);
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(and(eq(restaurantsTable.slug, slug), eq(restaurantsTable.isPublished, true)))
    .limit(1);
  if (!restaurant) return res.status(404).json({ error: "Menu not found" });
  await db.update(restaurantsTable).set({ menuViews: sql`${restaurantsTable.menuViews} + 1` }).where(eq(restaurantsTable.id, restaurant.id));
  const categories = await db.select({ id: categoriesTable.id, name: categoriesTable.name, description: categoriesTable.description, imageUrl: categoriesTable.imageUrl, isActive: categoriesTable.isActive, position: categoriesTable.position }).from(categoriesTable).where(and(eq(categoriesTable.restaurantId, restaurant.id), eq(categoriesTable.isActive, true))).orderBy(asc(categoriesTable.position));
  const products = await db.select({ id: productsTable.id, categoryId: productsTable.categoryId, categoryName: categoriesTable.name, name: productsTable.name, description: productsTable.description, price: productsTable.price, promotionalPrice: productsTable.promotionalPrice, imageUrl: productsTable.imageUrl, isActive: productsTable.isActive, isFeatured: productsTable.isFeatured, available: productsTable.available, position: productsTable.position, addonGroups: productsTable.addonGroups }).from(productsTable).innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).where(and(eq(productsTable.restaurantId, restaurant.id), eq(productsTable.isActive, true), eq(productsTable.available, true))).orderBy(asc(productsTable.position));
  return res.json({ restaurant: normalizeRestaurant(restaurant), categories: categories.map((category) => ({ ...category, productCount: products.filter((product) => product.categoryId === category.id).length, imageUrl: category.imageUrl ?? null })), products: products.map((product) => ({ ...product, imageUrl: product.imageUrl ?? null, promotionalPrice: product.promotionalPrice ?? null })) });
});

router.post("/menu/:slug/orders", async (req, res) => {
  const { slug } = CreatePublicOrderParams.parse(req.params);
  const input = CreatePublicOrderBody.parse(req.body);
  const [restaurant] = await db.select().from(restaurantsTable).where(and(eq(restaurantsTable.slug, slug), eq(restaurantsTable.isPublished, true))).limit(1);
  if (!restaurant) return res.status(404).json({ error: "Menu not found" });
  const productIds = input.items.map((item) => item.productId);
  const products = await db.select({ id: productsTable.id, name: productsTable.name, price: productsTable.price, promotionalPrice: productsTable.promotionalPrice, imageUrl: productsTable.imageUrl, addonGroups: productsTable.addonGroups }).from(productsTable).where(and(eq(productsTable.restaurantId, restaurant.id), inArray(productsTable.id, productIds)));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items: OrderItemData[] = [];
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) return res.status(400).json({ error: "One of the selected products is unavailable" });
    const selectedAddons: Addon[] = (product.addonGroups ?? []).flatMap((group: AddonGroup) => group.items).filter((addon) => item.addonIds?.includes(addon.id));
    const unitPrice = Number(product.promotionalPrice ?? product.price) + selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
    items.push({ productId: product.id, imageUrl: product.imageUrl ?? null, name: product.name, quantity: item.quantity, price: unitPrice, subtotal: unitPrice * item.quantity, addons: selectedAddons });
  }
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const [existingCustomer] = await db.select().from(customersTable).where(and(eq(customersTable.restaurantId, restaurant.id), eq(customersTable.whatsapp, input.customerWhatsapp))).limit(1);
  const customer = existingCustomer
    ? (await db.update(customersTable).set({ name: input.customerName, ordersCount: existingCustomer.ordersCount + 1, totalSpent: Number(existingCustomer.totalSpent) + total, lastOrderAt: new Date() }).where(eq(customersTable.id, existingCustomer.id)).returning())[0]
    : (await db.insert(customersTable).values({ restaurantId: restaurant.id, name: input.customerName, whatsapp: input.customerWhatsapp, ordersCount: 1, totalSpent: total, lastOrderAt: new Date() }).returning())[0];
  const number = `#${String(Date.now()).slice(-5)}`;
  const [order] = await db.insert(ordersTable).values({ restaurantId: restaurant.id, customerId: customer.id, number, customerName: input.customerName, customerWhatsapp: input.customerWhatsapp, total, orderType: input.orderType, paymentMethod: input.paymentMethod, address: input.address ?? null, note: input.note ?? null, items }).returning();
  const message = `Olá! Acabei de fazer o pedido ${order.number} pelo cardápio digital.\n\nValor: R$ ${total.toFixed(2).replace(".", ",")}\n\nGostaria de confirmar meu pedido.`;
  return res.status(201).json({ order: normalizeOrder(order), whatsappUrl: whatsappLink(restaurant.whatsapp, message) });
});

export default router;