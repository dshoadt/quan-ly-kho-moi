# 🔵 Giai đoạn 1: Nền tảng & Thiết lập Dự án

**Thời gian ước tính:** 2-3 ngày

## Mục tiêu
Thiết lập project TanStack Start, database, hệ sinh thái TanStack, và layout cơ bản.

## Công việc chi tiết
| # | Task | Mô tả |
|---|------|-------|
| 1.1 | Khởi tạo TanStack Start | `npm create @tanstack/start@latest` với TypeScript |
| 1.2 | Cài đặt TanStack ecosystem | TanStack Router, Query, Form, Table |
| 1.3 | Cài đặt Drizzle + PostgreSQL | Drizzle ORM, Drizzle Kit, pg |
| 1.4 | Cài đặt shadcn/ui | `npx shadcn@latest init` → Button, Input, Dialog, Table, Card, Badge, Select, Toast, Sidebar |
| 1.5 | Thiết kế Database Schema | Bảng: `Material`, `Transaction`, `Procurement`, `User` |
| 1.6 | Cấu hình Tailwind theme | Color palette, typography (Inter font), dark mode |
| 1.7 | Layout Components | Sidebar navigation (shadcn Sidebar), Header với `__root.tsx` |
| 1.8 | Trang Dashboard | Route `/` với metrics tổng quan, loader fetch dữ liệu |

## Database Schema (Drizzle ORM)
```typescript
// src/db/schema.ts
import { pgTable, varchar, doublePrecision, timestamp, text } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

// ==================== TABLES ====================

export const materials = pgTable("materials", {
  id:           varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  code:         varchar("code", { length: 50 }).notNull().unique(),   // Mã vật tư
  name:         varchar("name", { length: 255 }).notNull(),           // Tên vật tư
  unit:         varchar("unit", { length: 50 }).notNull(),            // Đơn vị tính
  location:     varchar("location", { length: 255 }),                 // Vị trí kho
  minStock:     doublePrecision("min_stock").notNull().default(0),    // Ngưỡng tối thiểu
  maxStock:     doublePrecision("max_stock").notNull().default(0),    // Ngưỡng tối đa
  currentStock: doublePrecision("current_stock").notNull().default(0),// SL tồn hiện tại
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id:         varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  type:       varchar("type", { length: 20 }).notNull(),  // "IMPORT" | "EXPORT"
  materialId: varchar("material_id", { length: 128 }).notNull()
                .references(() => materials.id),
  quantity:   doublePrecision("quantity").notNull(),
  customer:   varchar("customer", { length: 255 }),        // Khách hàng
  note:       text("note"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export const procurements = pgTable("procurements", {
  id:           varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  code:         varchar("code", { length: 50 }).notNull().unique(),  // Mã phiếu đề xuất
  status:       varchar("status", { length: 20 }).notNull().default("DRAFT"),
                // DRAFT | SUBMITTED | APPROVED
  priority:     varchar("priority", { length: 20 }).notNull().default("NORMAL"),
                // URGENT | NORMAL
  orderDate:    timestamp("order_date").defaultNow().notNull(),
  expectedDate: timestamp("expected_date"),                // Ngày giao dự kiến
  note:         text("note"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export const procurementItems = pgTable("procurement_items", {
  id:            varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  procurementId: varchar("procurement_id", { length: 128 }).notNull()
                   .references(() => procurements.id, { onDelete: "cascade" }),
  materialId:    varchar("material_id", { length: 128 }).notNull()
                   .references(() => materials.id),
  quantity:      doublePrecision("quantity").notNull(),     // Số lượng cần mua
  supplier:      varchar("supplier", { length: 255 }),      // Nhà cung cấp
  priority:      varchar("priority", { length: 20 }).notNull().default("NORMAL"),
});

export const users = pgTable("users", {
  id:        varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  email:     varchar("email", { length: 255 }).notNull().unique(),
  name:      varchar("name", { length: 255 }).notNull(),
  password:  varchar("password", { length: 255 }).notNull(),
  role:      varchar("role", { length: 20 }).notNull().default("USER"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== RELATIONS ====================

export const materialsRelations = relations(materials, ({ many }) => ({
  transactions:    many(transactions),
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
```

## Drizzle Client & Config
```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/warehouse_db
```

## Ví dụ Server Function & Route Loader
```typescript
// src/server/functions/materials.ts
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { lt, eq, sql } from "drizzle-orm";
import { z } from "zod";

// Lấy danh sách vật tư thiếu hàng
export const getLowStockMaterials = createServerFn({
  method: "GET",
}).handler(async () => {
  return db
    .select()
    .from(materials)
    .where(lt(materials.currentStock, materials.minStock));
});

// Tạo giao dịch nhập kho
export const createImportTransaction = createServerFn({
  method: "POST",
}).validator(
  z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    customer: z.string().optional(),
  })
).handler(async ({ data }) => {
  return db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      type: "IMPORT",
      materialId: data.materialId,
      quantity: data.quantity,
      customer: data.customer,
    });
    await tx
      .update(materials)
      .set({ currentStock: sql`${materials.currentStock} + ${data.quantity}` })
      .where(eq(materials.id, data.materialId));
  });
});
```

```typescript
// src/routes/_app/materials/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { getLowStockMaterials } from "@/server/functions/materials";

export const Route = createFileRoute("/_app/materials/")(
  {
    loader: async () => {
      const materials = await getAllMaterials();
      return { materials };
    },
    component: MaterialsPage,
  }
);

function MaterialsPage() {
  const { materials } = Route.useLoaderData();
  // ... render with shadcn/ui Table + TanStack Table
}
```

## Output giai đoạn 1
- ✅ Project TanStack Start chạy được với shadcn/ui
- ✅ PostgreSQL database đã migrate
- ✅ Layout chính (__root.tsx với Sidebar + Header) hoạt động
- ✅ Dashboard hiển thị placeholder metrics (với loader)
- ✅ Tailwind theme + Dark mode sẵn sàng
