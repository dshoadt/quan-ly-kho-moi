# 📋 Kế hoạch Triển khai Ứng dụng Web Quản lý Kho

> Dựa trên quy trình BPMN từ [qui-trinh.md](file:///c:/Users/admin/OneDrive/Máy tính/bpmn/qui-trinh.md)

## 🔍 Phân tích Quy trình Nghiệp vụ

```mermaid
graph LR
    P1["Giai đoạn 1<br/>Nền tảng"] --> P2["Giai đoạn 2<br/>Nhập/Xuất kho"]
    P2 --> P3["Giai đoạn 3<br/>Tồn kho & Cảnh báo"]
    P3 --> P4["Giai đoạn 4<br/>Đề xuất mua hàng"]
    P4 --> P5["Giai đoạn 5<br/>Báo cáo & In ấn"]
    P5 --> P6["Giai đoạn 6<br/>AI OCR"]
    P6 --> P7["Giai đoạn 7<br/>Hoàn thiện"]
```

Quy trình BPMN bao gồm **4 khối nghiệp vụ chính**:

| # | Khối nghiệp vụ | Mô tả |
|---|----------------|-------|
| 1 | **Tiếp nhận & Trích xuất** | Nhận chứng từ Excel/PDF → AI OCR → Phân tích thông tin (Mã/Tên VT, SL, ĐVT, Khách hàng) |
| 2 | **Nghiệp vụ Kho** | Phân loại Nhập/Xuất kho → Cập nhật danh mục vật tư → Kiểm tra ngưỡng tồn kho |
| 3 | **Kiểm soát Định mức & Báo cáo** | Phát hiện vật tư thừa (tồn > max) → Tạo báo cáo tồn kho |
| 4 | **Đề xuất Mua hàng** | Phát hiện vật tư thiếu (tồn < min) → Tính toán → Lập phiếu đề xuất → In/Lưu |

---

## 🏗️ Kiến trúc Tổng thể

```mermaid
graph TB
    subgraph Frontend["Frontend - TanStack Start"]
        UI["UI Components<br/>(shadcn/ui + Tailwind CSS)"]
        Router["TanStack Router<br/>(File-based, Type-safe)"]
        Query["TanStack Query<br/>(Server State)"]
        Forms["TanStack Form + Zod"]
    end

    subgraph Backend["Backend - TanStack Server Functions"]
        SF["Server Functions<br/>(RPC-style, type-safe)"]
        Auth["Authentication<br/>(Lucia Auth)"]
        BL["Business Logic"]
    end

    subgraph Data["Data Layer"]
        Drizzle["Drizzle ORM"]
        DB["PostgreSQL"]
    end

    subgraph Services["External Services"]
        OCR["AI OCR Service<br/>(Tesseract / Google Vision)"]
        PDF["PDF Generation<br/>(jsPDF / React-PDF)"]
    end

    Frontend --> Backend
    Backend --> Data
    Backend --> Services
```

### Công nghệ Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| **Framework** | TanStack Start | Fullstack React, SSR/SSG, Server Functions, hệ sinh thái TanStack đồ sộ |
| **Router** | TanStack Router | Type-safe routing, file-based, loader/action pattern |
| **Data Fetching** | TanStack Query | Server state management, caching, background refetch |
| **UI Components** | shadcn/ui | Radix UI primitives + Tailwind CSS, accessible, customizable |
| **Styling** | Tailwind CSS | Utility-first, tích hợp sẵn với shadcn/ui |
| **Database** | PostgreSQL | Mạnh mẽ, hỗ trợ JSON, full-text search, production-ready |
| **ORM** | Drizzle ORM | Lightweight, type-safe, SQL-like syntax, không cần code generation |
| **Auth** | Lucia Auth | Lightweight, framework-agnostic, session-based, phù hợp TanStack |
| **Form** | TanStack Form + Zod | Type-safe forms, tích hợp toàn bộ hệ sinh thái |
| **Table** | TanStack Table | Headless table, sorting, filtering, pagination |
| **OCR** | Tesseract.js / Google Cloud Vision | Trích xuất dữ liệu từ file |
| **PDF** | jsPDF + html2canvas | In phiếu đề xuất |

---

## 📦 Cấu trúc Thư mục Dự án

```
bpmn-warehouse-app/
├── drizzle/
│   └── migrations/            # SQL migration files
├── public/
│   └── assets/                # Static assets
├── src/
│   ├── routes/
│   │   ├── __root.tsx         # Root layout (Sidebar + Header)
│   │   ├── index.tsx          # Dashboard
│   │   ├── _auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── _app/                  # Authenticated layout group
│   │   │   ├── materials/
│   │   │   │   ├── index.tsx      # Danh mục vật tư
│   │   │   │   └── $id.tsx        # Chi tiết vật tư
│   │   │   ├── warehouse/
│   │   │   │   ├── import.tsx     # Nhập kho
│   │   │   │   └── export.tsx     # Xuất kho
│   │   │   ├── inventory/
│   │   │   │   └── index.tsx      # Tồn kho & cảnh báo
│   │   │   ├── procurement/
│   │   │   │   ├── index.tsx      # Danh sách phiếu đề xuất
│   │   │   │   ├── new.tsx        # Tạo phiếu mới
│   │   │   │   └── $id.tsx        # Chi tiết phiếu
│   │   │   ├── reports/
│   │   │   │   └── index.tsx      # Báo cáo
│   │   │   └── upload/
│   │   │       └── index.tsx      # Upload & OCR
│   ├── server/
│   │   ├── functions/             # TanStack Server Functions
│   │   │   ├── materials.ts
│   │   │   ├── warehouse.ts
│   │   │   ├── inventory.ts
│   │   │   ├── procurement.ts
│   │   │   ├── reports.ts
│   │   │   ├── ocr.ts
│   │   │   └── auth.ts
│   │   └── middleware.ts          # Auth middleware
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── ...
│   │   ├── layout/                # Sidebar, Header, Footer
│   │   ├── charts/                # Biểu đồ (Recharts)
│   │   └── forms/                 # Form components
│   ├── db/
│   │   ├── index.ts               # Drizzle client & PostgreSQL connection
│   │   ├── schema.ts              # Drizzle table definitions (pgTable)
│   │   └── seed.ts                # Seed data
│   ├── lib/
│   │   ├── auth.ts                # Lucia Auth config
│   │   └── utils.ts               # cn() utility + helpers
│   ├── hooks/                     # Custom hooks
│   ├── types/                     # TypeScript types
│   ├── styles/
│   │   └── globals.css            # Tailwind CSS globals
│   ├── router.tsx                 # TanStack Router config
│   └── entry-client.tsx           # Client entry
├── app.config.ts              # TanStack Start config
├── components.json            # shadcn/ui config
├── tailwind.config.ts         # Tailwind CSS config
├── drizzle.config.ts          # Drizzle Kit config
```

---

## 🚀 Các Giai đoạn Triển khai

---

### 🔵 Giai đoạn 1: Nền tảng & Thiết lập Dự án
> **Thời gian ước tính: 2-3 ngày**

#### Mục tiêu
Thiết lập project TanStack Start, database, hệ sinh thái TanStack, và layout cơ bản.

#### Công việc chi tiết

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

#### Database Schema (Drizzle ORM)

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

#### Drizzle Client & Config

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

#### Ví dụ Server Function & Route Loader

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

#### Output giai đoạn 1
- ✅ Project TanStack Start chạy được với shadcn/ui
- ✅ PostgreSQL database đã migrate
- ✅ Layout chính (__root.tsx với Sidebar + Header) hoạt động
- ✅ Dashboard hiển thị placeholder metrics (với loader)
- ✅ Tailwind theme + Dark mode sẵn sàng

---

### 🟢 Giai đoạn 2: Quản lý Vật tư & Nhập/Xuất kho
> **Thời gian ước tính: 3-4 ngày**
> 
> Tương ứng BPMN: **Khối 2 - Nghiệp vụ Kho**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 2.1 | CRUD Danh mục Vật tư | Thêm, sửa, xóa, tìm kiếm vật tư |
| 2.2 | Server Functions materials | `getAllMaterials`, `createMaterial`, `updateMaterial`, `deleteMaterial` |
| 2.3 | Form Nhập kho | Chọn vật tư, nhập SL, KH → cập nhật tồn (TanStack Form) |
| 2.4 | Form Xuất kho | Chọn vật tư, nhập SL, KH → kiểm tra tồn → cập nhật (TanStack Form) |
| 2.5 | Server Functions warehouse | `createImportTransaction`, `createExportTransaction` |
| 2.6 | Lịch sử giao dịch | Bảng hiển thị lịch sử nhập/xuất (TanStack Table) |
| 2.7 | Cập nhật tồn kho tự động | Logic trong server function sau mỗi giao dịch |

#### Luồng xử lý

```mermaid
sequenceDiagram
    actor User
    participant UI as Route Component
    participant SF as Server Function
    participant DB as Database

    User->>UI: Chọn Nhập/Xuất kho
    UI->>UI: Hiển thị form (TanStack Form)
    User->>UI: Điền thông tin (VT, SL, KH)
    UI->>SF: Gọi Server Function (RPC)
    SF->>SF: Validate dữ liệu (Zod)
    SF->>DB: Tạo Transaction
    SF->>DB: Cập nhật Material.currentStock
    SF-->>UI: Response success
    UI->>UI: TanStack Query invalidate & refetch
    UI-->>User: Thông báo thành công (Toast)
```

#### Output giai đoạn 2
- ✅ CRUD danh mục vật tư hoàn chỉnh
- ✅ Chức năng nhập kho
- ✅ Chức năng xuất kho (có kiểm tra tồn)
- ✅ Lịch sử giao dịch
- ✅ Tồn kho tự động cập nhật

---

### 🟡 Giai đoạn 3: Kiểm soát Tồn kho & Cảnh báo
> **Thời gian ước tính: 2-3 ngày**
> 
> Tương ứng BPMN: **Khối 2 (Kiểm tra ngưỡng) + Khối 3 (Kiểm soát định mức)**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 3.1 | Cấu hình ngưỡng min/max | Cho phép set ngưỡng tối thiểu/tối đa mỗi vật tư |
| 3.2 | Engine kiểm tra ngưỡng | Logic: `tồn < min` → thiếu, `tồn > max` → thừa |
| 3.3 | Trang Inventory Dashboard | Hiển thị toàn bộ tồn kho, highlight bất thường |
| 3.4 | Hệ thống cảnh báo | Badge, notification khi có vật tư vượt ngưỡng |
| 3.5 | Server Functions inventory | `getInventoryStatus`, `getAlerts` |
| 3.6 | Biểu đồ tồn kho | Recharts hiển thị phân bố tồn kho |

#### Logic kiểm tra ngưỡng

```
Với mỗi Vật tư:
├── currentStock < minStock → 🔴 THIẾU → Trigger đề xuất mua hàng
├── currentStock > maxStock → 🟡 THỪA → Cảnh báo + Đưa vào báo cáo
└── minStock ≤ currentStock ≤ maxStock → 🟢 BÌNH THƯỜNG
```

#### Output giai đoạn 3
- ✅ Thiết lập ngưỡng min/max cho vật tư
- ✅ Dashboard tồn kho với trạng thái trực quan
- ✅ Hệ thống cảnh báo (thiếu/thừa)
- ✅ Biểu đồ tồn kho

---

### 🟠 Giai đoạn 4: Đề xuất Mua hàng
> **Thời gian ước tính: 3-4 ngày**
> 
> Tương ứng BPMN: **Khối 4 - Kế hoạch & Đề xuất Mua hàng**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 4.1 | Tự động phát hiện vật tư thiếu | Scan vật tư có `tồn < min` |
| 4.2 | Tính toán số lượng cần mua | `SL cần mua = maxStock - currentStock` |
| 4.3 | Tạo phiếu đề xuất | Form tạo phiếu với danh mục vật tư |
| 4.4 | Chỉnh sửa phiếu | Thêm/xóa vật tư, chỉnh số lượng |
| 4.5 | Server Functions procurement | `createProcurement`, `updateProcurement`, `getProcurements` |
| 4.6 | Trạng thái phiếu | DRAFT → SUBMITTED → APPROVED |
| 4.7 | Tính ngày giao dự kiến | `Ngày đặt + 30 ngày` (có thể cấu hình) |

#### Cấu trúc Phiếu Đề xuất

```
┌─────────────────────────────────────────────┐
│          PHIẾU ĐỀ XUẤT MUA HÀNG            │
│  Mã phiếu: PO-2026-001                     │
│  Ngày tạo: 02/10/2026                       │
│  Ngày giao dự kiến: 01/11/2026              │
├─────┬──────────┬─────┬────┬────────┬────────┤
│ Mã  │ Tên VT   │ ĐVT │ SL │ NCC    │ T.Thái │
├─────┼──────────┼─────┼────┼────────┼────────┤
│ VT01│ Ống thép │ Cây │ 50 │ ABC Co │ Cần gấp│
│ VT02│ Bu lông  │ Con │200 │ XYZ Ltd│ B.thường│
└─────┴──────────┴─────┴────┴────────┴────────┘
│  [✏️ Chỉnh sửa]  [🖨️ In phiếu]  [💾 Lưu]  │
└─────────────────────────────────────────────┘
```

#### Output giai đoạn 4
- ✅ Phát hiện tự động vật tư cần mua
- ✅ Tạo và quản lý phiếu đề xuất
- ✅ Thêm/xóa/sửa vật tư trong phiếu
- ✅ Workflow trạng thái phiếu
- ✅ Tính ngày giao dự kiến

---

### 🔴 Giai đoạn 5: Báo cáo & In ấn
> **Thời gian ước tính: 2-3 ngày**
> 
> Tương ứng BPMN: **Khối 3 (Báo cáo) + Khối 4 (In phiếu)**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 5.1 | Báo cáo tồn kho | Tổng hợp tồn kho, VT thừa/thiếu |
| 5.2 | Báo cáo nhập/xuất | Theo khoảng thời gian |
| 5.3 | Export Excel | Xuất báo cáo ra file Excel |
| 5.4 | In phiếu đề xuất (PDF) | Tạo PDF phiếu đề xuất mua hàng |
| 5.5 | Template in phiếu | Thiết kế mẫu in đẹp, chuyên nghiệp |
| 5.6 | Biểu đồ thống kê | Charts cho dashboard |

#### Output giai đoạn 5
- ✅ Báo cáo tồn kho
- ✅ Báo cáo nhập/xuất
- ✅ Export Excel
- ✅ In phiếu đề xuất PDF
- ✅ Dashboard với biểu đồ

---

### 🟣 Giai đoạn 6: AI OCR - Trích xuất Dữ liệu
> **Thời gian ước tính: 3-4 ngày**
> 
> Tương ứng BPMN: **Khối 1 - Tiếp nhận & Trích xuất Dữ liệu**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 6.1 | Upload chứng từ | Drag & drop upload Excel/PDF |
| 6.2 | Parse file Excel | Đọc và trích xuất dữ liệu từ `.xlsx` |
| 6.3 | OCR cho PDF | Sử dụng Tesseract.js trích xuất text từ PDF/ảnh |
| 6.4 | Phân tích thông tin | AI mapping: xác định Mã VT, Tên, SL, ĐVT, KH |
| 6.5 | Review & Confirm | UI cho user xem lại dữ liệu trích xuất trước khi xử lý |
| 6.6 | Tự động tạo phiếu | Từ dữ liệu trích xuất → tạo phiếu nhập/xuất kho |

#### Luồng OCR

```mermaid
sequenceDiagram
    actor User
    participant Upload as Upload Page
    participant OCR as OCR Service
    participant Review as Review UI
    participant WH as Server Function

    User->>Upload: Upload file Excel/PDF
    Upload->>OCR: Gửi file xử lý
    OCR->>OCR: Trích xuất dữ liệu
    OCR->>OCR: Phân tích & mapping thông tin
    OCR-->>Review: Trả kết quả trích xuất
    Review-->>User: Hiển thị dữ liệu để xác nhận
    User->>Review: Xác nhận / Chỉnh sửa
    Review->>WH: Tạo phiếu Nhập/Xuất kho
    WH-->>User: Hoàn tất
```

#### Output giai đoạn 6
- ✅ Upload Excel/PDF
- ✅ Trích xuất dữ liệu tự động
- ✅ Giao diện review dữ liệu
- ✅ Tự động tạo phiếu từ chứng từ

---

### ⚪ Giai đoạn 7: Hoàn thiện & Tối ưu
> **Thời gian ước tính: 2-3 ngày**

#### Công việc chi tiết

| # | Task | Mô tả |
|---|------|-------|
| 7.1 | Authentication | Đăng nhập, phân quyền user |
| 7.2 | Responsive Design | Tối ưu cho mobile/tablet |
| 7.3 | Dark Mode | Toggle light/dark theme |
| 7.4 | Search & Filter nâng cao | Tìm kiếm toàn hệ thống |
| 7.5 | Error Handling | Xử lý lỗi toàn diện, toast notifications |
| 7.6 | Performance | Loading states, pagination, caching |
| 7.7 | Testing | Unit test cho business logic quan trọng |

#### Output giai đoạn 7
- ✅ Authentication hoàn chỉnh
- ✅ Responsive trên mọi thiết bị
- ✅ Dark/Light mode
- ✅ UX hoàn thiện

---

## 📊 Tổng hợp Timeline

```mermaid
gantt
    title Timeline Triển khai Ứng dụng
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section GĐ 1 - Nền tảng
    Khởi tạo project & DB          :a1, 2026-10-03, 3d
    
    section GĐ 2 - Nhập/Xuất kho
    CRUD Vật tư & Giao dịch kho    :a2, after a1, 4d
    
    section GĐ 3 - Tồn kho
    Kiểm soát ngưỡng & Cảnh báo    :a3, after a2, 3d
    
    section GĐ 4 - Đề xuất mua
    Phiếu đề xuất mua hàng         :a4, after a3, 4d
    
    section GĐ 5 - Báo cáo
    Báo cáo & In ấn                :a5, after a4, 3d
    
    section GĐ 6 - AI OCR
    Upload & Trích xuất dữ liệu    :a6, after a5, 4d
    
    section GĐ 7 - Hoàn thiện
    Auth, Responsive, Tối ưu       :a7, after a6, 3d
```

| Giai đoạn | Thời gian | Tổng tích lũy |
|-----------|-----------|----------------|
| 1. Nền tảng | 2-3 ngày | 2-3 ngày |
| 2. Nhập/Xuất kho | 3-4 ngày | 5-7 ngày |
| 3. Tồn kho & Cảnh báo | 2-3 ngày | 7-10 ngày |
| 4. Đề xuất mua hàng | 3-4 ngày | 10-14 ngày |
| 5. Báo cáo & In ấn | 2-3 ngày | 12-17 ngày |
| 6. AI OCR | 3-4 ngày | 15-21 ngày |
| 7. Hoàn thiện | 2-3 ngày | **17-24 ngày** |

> [!IMPORTANT]
> **Tổng thời gian ước tính: 17-24 ngày làm việc** (khoảng 3.5-5 tuần)

---

## ⚡ Thứ tự Ưu tiên Triển khai

> [!TIP]
> Mỗi giai đoạn được thiết kế để có thể **demo và sử dụng độc lập** sau khi hoàn thành. Đây là cách tiếp cận **Incremental Delivery** — mỗi giai đoạn đều mang lại giá trị ngay lập tức.

1. **GĐ 1 → GĐ 2**: Xây nền tảng và chức năng core nhất (nhập/xuất kho) → Có thể dùng ngay
2. **GĐ 3**: Thêm trí thông minh vào hệ thống (cảnh báo tự động)
3. **GĐ 4**: Tự động hóa quy trình mua hàng
4. **GĐ 5**: Báo cáo giúp ra quyết định
5. **GĐ 6**: AI nâng cao với OCR (phức tạp nhất, để cuối)
6. **GĐ 7**: Polish và hoàn thiện

---

## 🎯 Bạn muốn bắt đầu từ giai đoạn nào?

Tôi sẵn sàng bắt đầu code **Giai đoạn 1** ngay lập tức. Mỗi giai đoạn sẽ được triển khai tuần tự, đảm bảo ứng dụng luôn chạy được sau mỗi giai đoạn.
