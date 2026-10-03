import { pgTable, varchar, doublePrecision, timestamp, text } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

// ==================== TABLES ====================

export const materials = pgTable("materials", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  code: varchar("code", { length: 50 }).notNull().unique(), // Mã vật tư
  name: varchar("name", { length: 255 }).notNull(), // Tên vật tư
  unit: varchar("unit", { length: 50 }).notNull(), // Đơn vị tính
  location: varchar("location", { length: 255 }), // Vị trí kho
  minStock: doublePrecision("min_stock").notNull().default(0), // Ngưỡng tối thiểu
  maxStock: doublePrecision("max_stock").notNull().default(0), // Ngưỡng tối đa
  currentStock: doublePrecision("current_stock").notNull().default(0), // SL tồn hiện tại
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  type: varchar("type", { length: 20 }).notNull(), // "IMPORT" | "EXPORT"
  materialId: varchar("material_id", { length: 128 })
    .notNull()
    .references(() => materials.id),
  quantity: doublePrecision("quantity").notNull(),
  customer: varchar("customer", { length: 255 }), // Khách hàng
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const procurements = pgTable("procurements", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  code: varchar("code", { length: 50 }).notNull().unique(), // Mã phiếu đề xuất
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT | SUBMITTED | APPROVED
  priority: varchar("priority", { length: 20 }).notNull().default("NORMAL"), // URGENT | NORMAL
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDate: timestamp("expected_date"), // Ngày giao dự kiến
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const procurementItems = pgTable("procurement_items", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  procurementId: varchar("procurement_id", { length: 128 })
    .notNull()
    .references(() => procurements.id, { onDelete: "cascade" }),
  materialId: varchar("material_id", { length: 128 })
    .notNull()
    .references(() => materials.id),
  quantity: doublePrecision("quantity").notNull(), // Số lượng cần mua
  supplier: varchar("supplier", { length: 255 }), // Nhà cung cấp
  priority: varchar("priority", { length: 20 }).notNull().default("NORMAL"),
});

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("USER"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== RELATIONS ====================

export const materialsRelations = relations(materials, ({ many }) => ({
  transactions: many(transactions),
  procurementItems: many(procurementItems),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  material: one(materials, {
    fields: [transactions.materialId],
    references: [materials.id],
  }),
}));

export const procurementsRelations = relations(procurements, ({ many }) => ({
  items: many(procurementItems),
}));

export const procurementItemsRelations = relations(procurementItems, ({ one }) => ({
  procurement: one(procurements, {
    fields: [procurementItems.procurementId],
    references: [procurements.id],
  }),
  material: one(materials, {
    fields: [procurementItems.materialId],
    references: [materials.id],
  }),
}));
