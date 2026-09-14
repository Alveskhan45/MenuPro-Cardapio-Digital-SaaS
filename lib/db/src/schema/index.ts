import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const restaurantsTable = pgTable(
  "restaurants",
  {
    id: serial("id").primaryKey(),
    ownerClerkId: text("owner_clerk_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    phone: text("phone").notNull().default(""),
    whatsapp: text("whatsapp").notNull().default(""),
    address: text("address").notNull().default(""),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    primaryColor: text("primary_color").notNull().default("#FF5A36"),
    secondaryColor: text("secondary_color").notNull().default("#111827"),
    isOpen: boolean("is_open").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(true),
    menuViews: integer("menu_views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugUnique: uniqueIndex("restaurants_slug_unique").on(table.slug),
    ownerIndex: index("restaurants_owner_clerk_id_idx").on(table.ownerClerkId),
  }),
);

export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    restaurantIndex: index("categories_restaurant_id_idx").on(table.restaurantId),
  }),
);

export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    promotionalPrice: numeric("promotional_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    available: boolean("available").notNull().default(true),
    position: integer("position").notNull().default(0),
    addonGroups: jsonb("addon_groups").$type<AddonGroup[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    restaurantIndex: index("products_restaurant_id_idx").on(table.restaurantId),
    categoryIndex: index("products_category_id_idx").on(table.categoryId),
  }),
);

export const customersTable = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    ordersCount: integer("orders_count").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 10, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    lastOrderAt: timestamp("last_order_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    restaurantIndex: index("customers_restaurant_id_idx").on(table.restaurantId),
  }),
);

export const ordersTable = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurantsTable.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customersTable.id, {
      onDelete: "set null",
    }),
    number: text("number").notNull(),
    customerName: text("customer_name").notNull(),
    customerWhatsapp: text("customer_whatsapp").notNull(),
    time: timestamp("time", { withTimezone: true }).notNull().defaultNow(),
    total: numeric("total", { precision: 10, scale: 2, mode: "number" }).notNull(),
    orderType: text("order_type").notNull().default("delivery"),
    status: text("status").notNull().default("new"),
    paymentMethod: text("payment_method").notNull().default("PIX"),
    address: text("address"),
    note: text("note"),
    items: jsonb("items").$type<OrderItemData[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    restaurantIndex: index("orders_restaurant_id_idx").on(table.restaurantId),
    statusIndex: index("orders_status_idx").on(table.status),
  }),
);

export type Addon = { id: number; name: string; price: number };
export type AddonGroup = {
  id: number;
  name: string;
  required: boolean;
  min: number;
  max: number;
  items: Addon[];
};
export type OrderItemData = {
  productId?: number;
  imageUrl?: string | null;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  addons?: Addon[];
};

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Restaurant = typeof restaurantsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type Customer = typeof customersTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;