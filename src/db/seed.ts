import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { db } from "./index";
import { materials, transactions, procurements, procurementItems, users } from "./schema";
import { count } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingMaterials = await db.select({ value: count() }).from(materials);
  if (existingMaterials[0]?.value && existingMaterials[0].value > 0) {
    console.log("Database already contains data, skipping seed.");
    process.exit(0);
  }

  // 1. Seed Users
  await db
    .insert(users)
    .values([
      {
        email: "admin@kho.vn",
        name: "Quản trị viên Kho",
        password: "hashed_password_demo",
        role: "ADMIN",
      },
      {
        email: "nhanvien@kho.vn",
        name: "Thủ Kho Nguyễn Văn A",
        password: "hashed_password_demo",
        role: "USER",
      },
    ])
    .returning();

  // 2. Seed Materials
  const insertedMaterials = await db
    .insert(materials)
    .values([
      {
        code: "VT-001",
        name: "Thép phi 10 Hòa Phát",
        unit: "Tấn",
        location: "Kho A - Kệ 01",
        minStock: 20,
        maxStock: 100,
        currentStock: 12, // Dưới min (thiếu hàng)
      },
      {
        code: "VT-002",
        name: "Xi măng Hà Tiên PCB40",
        unit: "Bao",
        location: "Kho A - Bãi 02",
        minStock: 200,
        maxStock: 1000,
        currentStock: 450, // Bình thường
      },
      {
        code: "VT-003",
        name: "Sơn nước Dulux Weathershield",
        unit: "Thùng 18L",
        location: "Kho B - Kệ 03",
        minStock: 30,
        maxStock: 150,
        currentStock: 180, // Vượt max (thừa hàng)
      },
      {
        code: "VT-004",
        name: "Gạch Tuynel 4 lỗ Bình Dương",
        unit: "Viên",
        location: "Kho Bãi Ngoài Trời",
        minStock: 10000,
        maxStock: 50000,
        currentStock: 6500, // Dưới min (thiếu hàng)
      },
      {
        code: "VT-005",
        name: "Cát xây tô vàng hạt trung",
        unit: "m3",
        location: "Bãi Cát 01",
        minStock: 50,
        maxStock: 300,
        currentStock: 120, // Bình thường
      },
      {
        code: "VT-006",
        name: "Ống nhựa Tiền Phong PVC D90",
        unit: "Cây (4m)",
        location: "Kho C - Kệ 01",
        minStock: 100,
        maxStock: 600,
        currentStock: 45, // Dưới min (thiếu hàng)
      },
    ])
    .returning();

  // 3. Seed Transactions
  if (insertedMaterials.length >= 4) {
    await db.insert(transactions).values([
      {
        type: "IMPORT",
        materialId: insertedMaterials[0].id,
        quantity: 15,
        customer: "Công ty Thép Hòa Phát",
        note: "Nhập đợt 1 theo hợp đồng HP-2026",
      },
      {
        type: "EXPORT",
        materialId: insertedMaterials[0].id,
        quantity: 3,
        customer: "Công trình Nhà máy KCN VSIP",
        note: "Xuất theo phiếu yêu cầu số 482",
      },
      {
        type: "IMPORT",
        materialId: insertedMaterials[1].id,
        quantity: 500,
        customer: "Đại lý VLXD Minh Hưng",
        note: "Nhập kho định kỳ",
      },
      {
        type: "EXPORT",
        materialId: insertedMaterials[2].id,
        quantity: 10,
        customer: "Dự án Khu đô thị Ecopark",
        note: "Sơn hoàn thiện tầng 2",
      },
    ]);
  }

  // 4. Seed Procurements
  const [procurement] = await db
    .insert(procurements)
    .values([
      {
        code: "DX-2026-001",
        status: "SUBMITTED",
        priority: "URGENT",
        expectedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        note: "Đề xuất mua khẩn cấp vật tư thép và gạch thiếu cho dự án VSIP",
      },
      {
        code: "DX-2026-002",
        status: "DRAFT",
        priority: "NORMAL",
        expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        note: "Kế hoạch bổ sung ống nhựa Tiền Phong",
      },
    ])
    .returning();

  if (procurement && insertedMaterials.length >= 2) {
    await db.insert(procurementItems).values([
      {
        procurementId: procurement.id,
        materialId: insertedMaterials[0].id,
        quantity: 30,
        supplier: "Hòa Phát Group",
        priority: "URGENT",
      },
      {
        procurementId: procurement.id,
        materialId: insertedMaterials[3].id,
        quantity: 15000,
        supplier: "Gạch Tuynel Bình Dương",
        priority: "URGENT",
      },
    ]);
  }

  console.log("Seeding finished successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
