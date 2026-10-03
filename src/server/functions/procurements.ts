import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { procurements, procurementItems, materials } from "@/db/schema";
import { desc, eq, lt } from "drizzle-orm";
import { z } from "zod";

// Schema validation cho Thêm mới phiếu đề xuất mua hàng
export const createProcurementSchema = z.object({
  code: z
    .string()
    .min(2, "Mã phiếu tối thiểu 2 ký tự")
    .max(50)
    .transform((val) => val.trim().toUpperCase()),
  priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
  expectedDate: z.string().optional().nullable(),
  note: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "Vui lòng chọn vật tư"),
        quantity: z.number().positive("Số lượng cần mua phải lớn hơn 0"),
        supplier: z.string().optional().default(""),
        priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
      })
    )
    .min(1, "Phiếu đề xuất phải có ít nhất 1 vật tư cần mua"),
});

// Lấy toàn bộ phiếu đề xuất
export const getAllProcurements = createServerFn({
  method: "GET",
}).handler(async () => {
  const procs = await db
    .select()
    .from(procurements)
    .orderBy(desc(procurements.createdAt));

  const results = await Promise.all(
    procs.map(async (p) => {
      const items = await db
        .select({
          id: procurementItems.id,
          quantity: procurementItems.quantity,
          supplier: procurementItems.supplier,
          priority: procurementItems.priority,
          materialId: materials.id,
          materialCode: materials.code,
          materialName: materials.name,
          materialUnit: materials.unit,
          currentStock: materials.currentStock,
          minStock: materials.minStock,
        })
        .from(procurementItems)
        .innerJoin(materials, eq(procurementItems.materialId, materials.id))
        .where(eq(procurementItems.procurementId, p.id));

      return {
        ...p,
        items,
      };
    })
  );

  return results;
});

// Lấy danh sách vật tư thiếu hàng phục vụ tự động gợi ý lập phiếu
export const getLowStockSuggestions = createServerFn({
  method: "GET",
}).handler(async () => {
  const lowMaterials = await db
    .select()
    .from(materials)
    .where(lt(materials.currentStock, materials.minStock));

  return lowMaterials.map((m) => ({
    materialId: m.id,
    materialCode: m.code,
    materialName: m.name,
    materialUnit: m.unit,
    currentStock: m.currentStock,
    minStock: m.minStock,
    maxStock: m.maxStock,
    suggestedQuantity:
      m.maxStock > m.currentStock
        ? m.maxStock - m.currentStock
        : Math.max(1, m.minStock - m.currentStock),
  }));
});

// Tạo mới phiếu đề xuất mua hàng (Task 4.3 & Form Drawer)
export const createProcurement = createServerFn({
  method: "POST",
})
  .validator(createProcurementSchema)
  .handler(async ({ data }) => {
    return db.transaction(async (tx) => {
      // 1. Kiểm tra mã phiếu đã tồn tại chưa
      const [existing] = await tx
        .select()
        .from(procurements)
        .where(eq(procurements.code, data.code));

      if (existing) {
        throw new Error(`Mã phiếu đề xuất "${data.code}" đã tồn tại! Vui lòng chọn mã khác.`);
      }

      // 2. Tạo bản ghi phiếu đề xuất
      const [newProc] = await tx
        .insert(procurements)
        .values({
          code: data.code,
          status: "DRAFT",
          priority: data.priority,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          note: data.note?.trim() || null,
        })
        .returning();

      // 3. Thêm danh mục chi tiết các vật tư vào phiếu
      for (const item of data.items) {
        await tx.insert(procurementItems).values({
          procurementId: newProc.id,
          materialId: item.materialId,
          quantity: item.quantity,
          supplier: item.supplier?.trim() || null,
          priority: item.priority,
        });
      }

      return {
        success: true,
        procurement: newProc,
        message: `Đã lập phiếu đề xuất mua hàng "${newProc.code}" thành công với ${data.items.length} mặt hàng!`,
      };
    });
  });
