/* Mock da API para o modo demo.
   O GitHub Pages e estatico: nao ha Express nem Postgres. Este arquivo intercepta
   window.fetch e responde os endpoints /api/* com dados de exemplo, em memoria.
   Escritas (POST/PATCH/DELETE) alteram o estado da sessao, entao o painel
   parece real: da para criar produto, mudar status de pedido, etc.
   Nao ha persistencia: recarregar a pagina volta ao inicio. */

type Json = Record<string, unknown>;

const slug = "casa-do-burguer";

const restaurant = {
  id: 1,
  name: "Casa do Burguer",
  slug,
  description: "Smash burgers, batatas fritas e shakes gelados todos os dias ate a meia-noite.",
  phone: "(11) 4002-8922",
  whatsapp: "5511940028922",
  address: "Rua das Palmeiras, 320",
  city: "Sao Paulo",
  state: "SP",
  logoUrl: null,
  bannerUrl: null,
  primaryColor: "#e5582e",
  secondaryColor: "#294b49",
  isOpen: true,
  isPublished: true,
};

let categories = [
  { id: 1, name: "Burgers", description: "Smash 180g elish", imageUrl: null, isActive: true, productCount: 4, position: 1 },
  { id: 2, name: "Poroes e Acompanhamentos", description: "", imageUrl: null, isActive: true, productCount: 3, position: 2 },
  { id: 3, name: "Bebidas", description: "Geladas e shaken", imageUrl: null, isActive: true, productCount: 4, position: 3 },
];

const sizeGroup = {
  id: 1,
  name: "Tamanho",
  required: true,
  min: 1,
  max: 1,
  items: [
    { id: 101, name: "Simples", price: 0 },
    { id: 102, name: "Duplo", price: 12 },
  ],
};

const extrasGroup = {
  id: 2,
  name: "Adicionais",
  required: false,
  min: 0,
  max: 4,
  items: [
    { id: 201, name: "Bacon extra", price: 6 },
    { id: 202, name: "Cheddar", price: 4 },
    { id: 203, name: "Ovo", price: 3 },
  ],
};

let products = [
  { id: 1, categoryId: 1, categoryName: "Burgers", name: "Smash Clasico", description: "Carne 180g, queijo, alface e molho da casa", price: 32.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: true, available: true, position: 1, addonGroups: [sizeGroup, extrasGroup] },
  { id: 2, categoryId: 1, categoryName: "Burgers", name: "Smash Duplo", description: "Duas carnes 180g e cheddar derretido", price: 44.9, promotionalPrice: 39.9, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 2, addonGroups: [extrasGroup] },
  { id: 3, categoryId: 1, categoryName: "Burgers", name: "X-Tudo", description: "Tudo dentro: carne, ovo, bacon e milho", price: 49.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 3, addonGroups: [extrasGroup] },
  { id: 4, categoryId: 1, categoryName: "Burgers", name: "Vegano", description: "Hamburguer de grao-de-bico e pao integral", price: 36.9, promotionalPrice: null, imageUrl: null, isActive: false, isFeatured: false, available: false, position: 4, addonGroups: [] },
  { id: 5, categoryId: 2, categoryName: "Poroes e Acompanhamentos", name: "Batata frita rustica", description: "Porcao media com sal marinho", price: 24.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 1, addonGroups: [] },
  { id: 6, categoryId: 2, categoryName: "Poroes e Acompanhamentos", name: "Onion rings", description: "Cebola empanada, 10 unidades", price: 22.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 2, addonGroups: [] },
  { id: 7, categoryId: 2, categoryName: "Poroes e Acompanhamentos", name: "Batata doce frita", description: "Com canela e mel", price: 23.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 3, addonGroups: [] },
  { id: 8, categoryId: 3, categoryName: "Bebidas", name: "Refrigerante lata", description: "Coca, Guarena ou Sprite", price: 7.5, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 1, addonGroups: [] },
  { id: 9, categoryId: 3, categoryName: "Bebidas", name: "Suco natural 500ml", description: "Laranja, maracuja ou limao", price: 12, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: true, position: 2, addonGroups: [] },
  { id: 10, categoryId: 3, categoryName: "Bebidas", name: "Cerveja long neck", description: "Original 355ml gelada", price: 11.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: true, available: true, position: 3, addonGroups: [] },
  { id: 11, categoryId: 3, categoryName: "Bebidas", name: "Brownie com sorvete", description: "Brownie quente e bola de sorvete creme", price: 19.9, promotionalPrice: null, imageUrl: null, isActive: true, isFeatured: false, available: false, position: 4, addonGroups: [] },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

let orders = [
  {
    id: 1, number: "#10241", customerName: "Mariana Costa", customerWhatsapp: "5511981112233",
    time: hoursAgo(1), total: 74.8, orderType: "delivery", status: "new",
    paymentMethod: "Pix", address: "Rua Augusta, 900", note: null,
    items: [
      { name: "Smash Clasico", quantity: 1, price: 44.9, subtotal: 44.9, addons: [{ id: 102, name: "Duplo", price: 12 }] },
      { name: "Refrigerante lata", quantity: 1, price: 7.5, subtotal: 7.5, addons: [] },
    ],
  },
  {
    id: 2, number: "#10240", customerName: "Rafael Nunes", customerWhatsapp: "5511992223344",
    time: hoursAgo(3), total: 39.9, orderType: "pickup", status: "preparing",
    paymentMethod: "Dinheiro", address: null, note: "Buscar 20h",
    items: [{ name: "Smash Duplo", quantity: 1, price: 39.9, subtotal: 39.9, addons: [] }],
  },
  {
    id: 3, number: "#10239", customerName: "Juliana Prado", customerWhatsapp: "5511973334455",
    time: hoursAgo(26), total: 121.7, orderType: "delivery", status: "completed",
    paymentMethod: "Cartao", address: "Av. Paulista, 1500", note: null,
    items: [
      { name: "X-Tudo", quantity: 2, price: 49.9, subtotal: 99.8, addons: [] },
      { name: "Batata frita rustica", quantity: 1, price: 21.9, subtotal: 21.9, addons: [] },
    ],
  },
  {
    id: 4, number: "#10238", customerName: "Pedro Alves", customerWhatsapp: "5511964445566",
    time: hoursAgo(30), total: 68.7, orderType: "delivery", status: "cancelled",
    paymentMethod: "Pix", address: "Rua Bela Cintra, 400", note: "Pediu para cancelar",
    items: [
      { name: "Smash Clasico", quantity: 1, price: 44.9, subtotal: 44.9, addons: [] },
      { name: "Cerveja long neck", quantity: 2, price: 11.9, subtotal: 23.8, addons: [] },
    ],
  },
];

let customers = [
  { id: 1, name: "Mariana Costa", whatsapp: "5511981112233", ordersCount: 12, totalSpent: 840.5, lastOrderAt: hoursAgo(1) },
  { id: 2, name: "Rafael Nunes", whatsapp: "5511992223344", ordersCount: 7, totalSpent: 312.3, lastOrderAt: hoursAgo(3) },
  { id: 3, name: "Juliana Prado", whatsapp: "5511973334455", ordersCount: 21, totalSpent: 1687.9, lastOrderAt: hoursAgo(26) },
  { id: 4, name: "Pedro Alves", whatsapp: "5511964445566", ordersCount: 3, totalSpent: 128.4, lastOrderAt: hoursAgo(30) },
];

let nextProductId = 12;
let nextCategoryId = 4;
let nextOrderId = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function publicCategories() {
  return categories
    .filter((c) => c.isActive)
    .map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id && p.isActive && p.available).length }));
}

function publicProducts() {
  return products.filter((p) => p.isActive && p.available);
}

function buildSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const live = orders.filter((o) => o.status !== "cancelled");
  const todayOrders = live.filter((o) => new Date(o.time) >= today);
  const pending = new Set(["new", "confirmed", "preparing", "ready", "delivering"]);

  const totals = new Map<number, { id: number; name: string; quantity: number; revenue: number; imageUrl: string | null }>();
  for (const order of live) {
    for (const item of order.items) {
      const key = products.find((p) => p.name === item.name)?.id ?? 0;
      const entry = totals.get(key) ?? { id: key, name: item.name, quantity: 0, revenue: 0, imageUrl: null };
      entry.quantity += item.quantity;
      entry.revenue += item.subtotal;
      totals.set(key, entry);
    }
  }

  const weeklySales = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      value: live.filter((o) => o.time.slice(0, 10) === key).reduce((sum, o) => sum + o.total, 0),
    };
  });

  return {
    ordersToday: todayOrders.length,
    salesToday: todayOrders.reduce((sum, o) => sum + o.total, 0),
    pendingOrders: live.filter((o) => pending.has(o.status)).length,
    productsCount: products.length,
    customersCount: customers.length,
    menuViews: 1284,
    weeklySales,
    recentOrders: orders.slice(0, 5),
    topProducts: [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
}

async function readBody(init: RequestInit | undefined): Promise<Json> {
  if (!init?.body) return {};
  try {
    return JSON.parse(String(init.body)) as Json;
  } catch {
    return {};
  }
}

export function isDemoApiRequest(url: string): boolean {
  const path = url.split("?")[0];
  return path.includes("/api/");
}

export async function handleDemoApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^.*\/api/, "") || "/";
  const method = request.method.toUpperCase();
  const segments = path.split("/").filter(Boolean);

  if (path === "/healthz") return json({ status: "ok" });

  if (path === "/restaurant") {
    if (method === "GET") return json(restaurant);
    if (method === "PATCH") {
      Object.assign(restaurant, await readBody(request as RequestInit));
      return json(restaurant);
    }
  }

  if (path === "/dashboard/summary" && method === "GET") return json(buildSummary());

  if (segments[0] === "categories") {
    if (segments.length === 1 && method === "GET") return json(categories);
    if (segments.length === 1 && method === "POST") {
      const body = await readBody(request as RequestInit);
      const created = {
        id: nextCategoryId++,
        name: String(body.name ?? "Nova categoria"),
        description: String(body.description ?? ""),
        imageUrl: null,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        productCount: 0,
        position: categories.length + 1,
      };
      categories = [...categories, created];
      return json(created, 201);
    }
    const categoryId = Number(segments[1]);
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return json({ error: "Category not found" }, 404);
    if (method === "PATCH") {
      const body = await readBody(request as RequestInit);
      categories[index] = { ...categories[index], ...body, id: categoryId } as (typeof categories)[number];
      return json(categories[index]);
    }
    if (method === "DELETE") {
      categories = categories.filter((c) => c.id !== categoryId);
      return new Response(null, { status: 204 });
    }
  }

  if (segments[0] === "products") {
    if (segments.length === 1 && method === "GET") {
      const categoryId = url.searchParams.get("categoryId");
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search")?.toLowerCase();
      let result = products;
      if (categoryId) result = result.filter((p) => p.categoryId === Number(categoryId));
      if (status === "active") result = result.filter((p) => p.isActive);
      if (status === "inactive") result = result.filter((p) => !p.isActive);
      if (search) {
        result = result.filter(
          (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
        );
      }
      return json(result);
    }
    if (segments.length === 1 && method === "POST") {
      const body = await readBody(request as RequestInit);
      const category = categories.find((c) => c.id === Number(body.categoryId));
      const created = {
        id: nextProductId++,
        categoryId: Number(body.categoryId),
        categoryName: category?.name ?? "",
        name: String(body.name ?? "Novo produto"),
        description: String(body.description ?? ""),
        price: Number(body.price ?? 0),
        promotionalPrice: body.promotionalPrice === undefined ? null : Number(body.promotionalPrice),
        imageUrl: null,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        isFeatured: Boolean(body.isFeatured),
        available: body.available === undefined ? true : Boolean(body.available),
        position: products.length + 1,
        addonGroups: [],
      };
      products = [...products, created];
      return json(created, 201);
    }
    const productId = Number(segments[1]);
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return json({ error: "Product not found" }, 404);
    if (method === "PATCH") {
      const body = await readBody(request as RequestInit);
      products[index] = { ...products[index], ...body, id: productId } as (typeof products)[number];
      return json(products[index]);
    }
    if (method === "DELETE") {
      products = products.filter((p) => p.id !== productId);
      return new Response(null, { status: 204 });
    }
  }

  if (segments[0] === "orders") {
    if (segments.length === 1 && method === "GET") {
      const status = url.searchParams.get("status");
      const limit = Number(url.searchParams.get("limit") ?? 100);
      let result = orders;
      if (status && status !== "all") result = result.filter((o) => o.status === status);
      return json(result.slice(0, limit));
    }
    if (segments.length === 3 && segments[2] === "status" && method === "PATCH") {
      const orderId = Number(segments[1]);
      const body = await readBody(request as RequestInit);
      const index = orders.findIndex((o) => o.id === orderId);
      if (index === -1) return json({ error: "Order not found" }, 404);
      orders[index] = { ...orders[index], status: String(body.status ?? orders[index].status) } as (typeof orders)[number];
      return json(orders[index]);
    }
  }

  if (segments[0] === "customers" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase();
    let result = customers;
    if (search) {
      result = result.filter(
        (c) => c.name.toLowerCase().includes(search) || c.whatsapp.includes(search),
      );
    }
    return json(result);
  }

  if (segments[0] === "menu" && segments.length >= 2) {
    const menuSlug = segments[1];
    if (menuSlug !== slug) return json({ error: "Menu not found" }, 404);

    if (segments.length === 2 && method === "GET") {
      return json({ restaurant, categories: publicCategories(), products: publicProducts() });
    }

    if (segments.length === 3 && segments[2] === "orders" && method === "POST") {
      const body = await readBody(request as RequestInit);
      const rawItems = (body.items ?? []) as Array<{ productId: number; quantity: number; addonIds?: number[] }>;
      const items = [];
      for (const item of rawItems) {
        const product = products.find((p) => p.id === Number(item.productId));
        if (!product || !product.isActive || !product.available) {
          return json({ error: "One of the selected products is unavailable" }, 400);
        }
        const wanted = new Set((item.addonIds ?? []).map(Number));
        const addons = product.addonGroups
          .flatMap((group) => group.items)
          .filter((addon) => wanted.has(addon.id));
        const unit = (product.promotionalPrice ?? product.price) + addons.reduce((s, a) => s + a.price, 0);
        const quantity = Math.max(1, Number(item.quantity));
        items.push({ name: product.name, quantity, price: unit, subtotal: unit * quantity, addons });
      }
      if (items.length === 0) return json({ error: "Carrinho vazio" }, 400);
      const total = items.reduce((s, i) => s + i.subtotal, 0);
      const order = {
        id: nextOrderId++,
        number: `#${10241 + nextOrderId}`,
        customerName: String(body.customerName ?? "Cliente Demo"),
        customerWhatsapp: String(body.customerWhatsapp ?? "5511999999999"),
        time: new Date().toISOString(),
        total,
        orderType: String(body.orderType ?? "delivery"),
        status: "new",
        paymentMethod: String(body.paymentMethod ?? "Pix"),
        address: body.address ? String(body.address) : null,
        note: body.note ? String(body.note) : null,
        items,
      };
      orders = [order, ...orders];
      const customer = customers.find((c) => c.whatsapp === order.customerWhatsapp);
      if (customer) {
        customer.ordersCount += 1;
        customer.totalSpent += total;
        customer.lastOrderAt = order.time;
      } else {
        customers = [...customers, { id: customers.length + 1, name: order.customerName, whatsapp: order.customerWhatsapp, ordersCount: 1, totalSpent: total, lastOrderAt: order.time }];
      }
      const message = `Ola! Acabei de fazer o pedido ${order.number} pelo cardapio digital.\n\nValor: R$ ${total.toFixed(2).replace(".", ",")}`;
      return json({ order, whatsappUrl: `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(message)}` }, 201);
    }
  }

  return json({ error: `Rota nao encontrada no demo: ${method} ${path}` }, 404);
}

export function installDemoApi(): void {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!isDemoApiRequest(url)) return original(input as RequestInfo, init);
    const request = new Request(input as RequestInfo, init);
    return handleDemoApi(request);
  };
}
