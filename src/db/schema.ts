import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", [
  "received",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
]);

export const fulfillmentType = pgEnum("fulfillment_type", ["delivery", "pickup"]);
export const paymentMethod = pgEnum("payment_method", ["pix", "card", "cash"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "paused", "cancelled"]);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    originalPriceInCents: integer("original_price_in_cents"),
    imageUrl: text("image_url").notNull(),
    badge: text("badge"),
    prepMinutes: integer("prep_minutes").notNull().default(25),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_category_idx").on(table.categoryId),
  ],
);

export const dailyMenus = pgTable(
  "daily_menus",
  {
    id: serial("id").primaryKey(),
    serviceDate: date("service_date").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("daily_menus_date_idx").on(table.serviceDate)],
);

export const dailyMenuItems = pgTable(
  "daily_menu_items",
  {
    id: serial("id").primaryKey(),
    dailyMenuId: integer("daily_menu_id")
      .notNull()
      .references(() => dailyMenus.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    soldOut: boolean("sold_out").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("daily_menu_items_menu_idx").on(table.dailyMenuId)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    birthday: date("birthday"),
    points: integer("points").notNull().default(0),
    tier: text("tier").notNull().default("Prata"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("customers_phone_idx").on(table.phone)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Casa"),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull().default("Junqueirópolis"),
    zipCode: text("zip_code"),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [index("addresses_customer_idx").on(table.customerId)],
);

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    code: text("code").notNull(),
    description: text("description").notNull(),
    discountPercent: integer("discount_percent").notNull(),
    maxRedemptions: integer("max_redemptions").notNull().default(100),
    redemptions: integer("redemptions").notNull().default(0),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("promotions_code_idx").on(table.code)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    fulfillment: fulfillmentType("fulfillment").notNull(),
    deliveryAddress: text("delivery_address"),
    subtotalInCents: integer("subtotal_in_cents").notNull(),
    deliveryFeeInCents: integer("delivery_fee_in_cents").notNull().default(0),
    discountInCents: integer("discount_in_cents").notNull().default(0),
    totalInCents: integer("total_in_cents").notNull(),
    status: orderStatus("status").notNull().default("received"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    couponCode: text("coupon_code"),
    notes: text("notes"),
    estimatedAt: timestamp("estimated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_customer_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    unitPriceInCents: integer("unit_price_in_cents").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const loyaltyLedger = pgTable(
  "loyalty_ledger",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("loyalty_customer_idx").on(table.customerId)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    planName: text("plan_name").notNull(),
    mealsPerMonth: integer("meals_per_month").notNull(),
    mealsRemaining: integer("meals_remaining").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    status: subscriptionStatus("status").notNull().default("active"),
    renewsAt: date("renews_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subscriptions_customer_idx").on(table.customerId)],
);

export const corporateAccounts = pgTable(
  "corporate_accounts",
  {
    id: serial("id").primaryKey(),
    companyName: text("company_name").notNull(),
    taxId: text("tax_id"),
    contactName: text("contact_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    billingDay: integer("billing_day").notNull().default(5),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("corporate_company_idx").on(table.companyName)],
);
