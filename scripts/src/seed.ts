import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  categoriesTable,
  customersTable,
  ordersTable,
  productsTable,
  restaurantsTable,
} from "@workspace/db";

const [restaurant] = await db
  .insert(restaurantsTable)
  .values({
    name: "Burger House",
    slug: "burger-house",
    description: "Hambúrguer artesanal, combos e milkshakes feitos na hora.",
    phone: "(85) 99999-0000",
    whatsapp: "5585999990000",
    address: "Av. Beira Mar, 1200",
    city: "Fortaleza",
    state: "CE",
    primaryColor: "#FF5A36",
    secondaryColor: "#111827",
    isOpen: true,
    isPublished: true,
    menuViews: 1842,
  })
  .onConflictDoNothing({ target: restaurantsTable.slug })
  .returning();

const currentRestaurant =
  restaurant ??
  (await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.slug, "burger-house"))
    .limit(1))[0];

if (!currentRestaurant) throw new Error("Unable to create the demo restaurant");

await db
  .update(restaurantsTable)
  .set({ name: "Burger House", updatedAt: new Date() })
  .where(eq(restaurantsTable.id, currentRestaurant.id));

const categorySeeds = [
  ["Hambúrgueres", "Os clássicos da casa", 1],
  ["Combos", "Tudo que combina com fome", 2],
  ["Bebidas", "Geladas e refrescantes", 3],
  ["Sobremesas", "Para fechar bem", 4],
] as const;

const categories = [];
for (const [name, description, position] of categorySeeds) {
  const existing = (
    await db
      .select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.restaurantId, currentRestaurant.id), eq(categoriesTable.name, name)))
      .limit(1)
  )[0];
  categories.push(
    existing ??
      (
        await db
          .insert(categoriesTable)
          .values({ restaurantId: currentRestaurant.id, name, description, position })
          .returning()
      )[0],
  );
}

const categoryByName = new Map(categories.map((category) => [category.name, category]));
const productSeeds = [
  ["Hambúrgueres", "Classic Burger", "Pão brioche, blend da casa, queijo e molho especial", 29.9, null, true, 1],
  ["Hambúrgueres", "Bacon Burger", "Blend 180g, cheddar cremoso, bacon crocante e barbecue", 36.9, 32.9, true, 2],
  ["Hambúrgueres", "Cheddar Burger", "Blend 180g, cheddar duplo e cebola caramelizada", 34.9, null, false, 3],
  ["Combos", "Combo Bacon", "Bacon Burger + batata crocante + refrigerante", 49.9, 44.9, true, 1],
  ["Bebidas", "Coca-Cola", "Lata 350ml bem gelada", 6, null, false, 2],
  ["Bebidas", "Batata Frita", "Porção individual com páprica defumada", 14.9, null, false, 3],
  ["Sobremesas", "Milkshake de Chocolate", "Cremoso, com calda de chocolate e chantilly", 18.9, null, true, 1],
  ["Sobremesas", "Brownie com Sorvete", "Brownie quente, sorvete de creme e calda", 22.9, null, false, 2],
] as const;

for (const [categoryName, name, description, price, promotionalPrice, isFeatured, position] of productSeeds) {
  const category = categoryByName.get(categoryName);
  if (!category) continue;
  const existing = (
    await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.restaurantId, currentRestaurant.id), eq(productsTable.name, name)))
      .limit(1)
  )[0];
  if (!existing) {
    await db.insert(productsTable).values({
      restaurantId: currentRestaurant.id,
      categoryId: category.id,
      name,
      description,
      price,
      promotionalPrice,
      isFeatured,
      position,
      addonGroups: [],
    });
  }
}

console.log(`Seed ready for ${currentRestaurant.name} at /menu/${currentRestaurant.slug}`);