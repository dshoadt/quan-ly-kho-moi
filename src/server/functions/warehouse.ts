import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema validation cho giao dịch kho
const warehouseTransactionSchema = z.object({
  materialId: z.string().min(1, "Vui lòng chọn vật tư"),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  customer: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

// Lấy danh sách toàn bộ giao dịch kho (có join thông tin vật tư)
export const getWarehouseTransactions = createServerFn({
  method: "GET",
})
  .validator(
    z
      .object({
        type: z.enum(["ALL", "IMPORT", "EXPORT"]).optional().default("ALL"),
      })
      .optional()
  )
  .handler(async ({ data }) => {
    const query = db
      .select({
        id: transactions.id,
        type: transactions.type,
        quantity: transactions.quantity,
        customer: transactions.customer,
        note: transactions.note,
        createdAt: transactions.createdAt,
        materialId: materials.id,
        materialCode: materials.code,
        materialName: materials.name,
        materialUnit: materials.unit,
        currentStock: materials.currentStock,
      })
      .from(transactions)
      .innerJoin(materials, eq(transactions.materialId, materials.id));

    if (data?.type && data.type !== "ALL") {
      const filtered = await query
        .where(eq(transactions.type, data.type))
        .orderBy(desc(transactions.createdAt));
      return filtered;
    }

    return await query.orderBy(desc(transactions.createdAt));
  });

// Tạo giao dịch Nhập kho
export const createImportTransaction = createServerFn({
  method: "POST",
})
  .validator(warehouseTransactionSchema)
  .handler(async ({ data }) => {
    return db.transaction(async (tx) => {
      // 1. Kiểm tra vật tư tồn tại
      const [mat] = await tx
        .select()
        .from(materials)
        .where(eq(materials.id, data.materialId));

      if (!mat) {
        throw new Error("Không tìm thấy vật tư trong hệ thống!");
      }

      // 2. Thêm bản ghi giao dịch
      const [newTx] = await tx
        .insert(transactions)
        .values({
          type: "IMPORT",
          materialId: data.materialId,
          quantity: data.quantity,
          customer: data.customer?.trim() || null,
          note: data.note?.trim() || null,
        })
        .returning();

      // 3. Tăng tồn kho tự động
      const [updatedMaterial] = await tx
        .update(materials)
        .set({
          currentStock: sql`${materials.currentStock} + ${data.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(materials.id, data.materialId))
        .returning();

      return {
        success: true,
        transaction: newTx,
        material: updatedMaterial,
        message: `Đã nhập thành công ${data.quantity} ${mat.unit} "${mat.name}". Tồn kho mới: ${updatedMaterial.currentStock} ${mat.unit}.`,
      };
    });
  });

// Tạo giao dịch Xuất kho (có kiểm tra tồn kho)
export const createExportTransaction = createServerFn({
  method: "POST",
})
  .validator(warehouseTransactionSchema)
  .handler(async ({ data }) => {
    return db.transaction(async (tx) => {
      // 1. Kiểm tra vật tư và tồn kho khả dụng
      const [mat] = await tx
        .select()
        .from(materials)
        .where(eq(materials.id, data.materialId));

      if (!mat) {
        throw new Error("Không tìm thấy vật tư trong hệ thống!");
      }

      if (mat.currentStock < data.quantity) {
        throw new Error(
          `Không đủ tồn kho để xuất! Vật tư "${mat.name}" hiện chỉ còn ${mat.currentStock} ${mat.unit} (yêu cầu xuất: ${data.quantity} ${mat.unit}).`
        );
      }

      // 2. Thêm bản ghi giao dịch xuất
      const [newTx] = await tx
        .insert(transactions)
        .values({
          type: "EXPORT",
          materialId: data.materialId,
          quantity: data.quantity,
          customer: data.customer?.trim() || null,
          note: data.note?.trim() || null,
        })
        .returning();

      // 3. Trừ tồn kho tự động
      const [updatedMaterial] = await tx
        .update(materials)
        .set({
          currentStock: sql`${materials.currentStock} - ${data.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(materials.id, data.materialId))
        .returning();

      return {
        success: true,
        transaction: newTx,
        material: updatedMaterial,
        message: `Đã xuất thành công ${data.quantity} ${mat.unit} "${mat.name}". Tồn kho còn lại: ${updatedMaterial.currentStock} ${mat.unit}.`,
      };
    });
  });
