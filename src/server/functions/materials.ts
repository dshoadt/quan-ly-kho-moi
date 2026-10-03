import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { materials, transactions, procurementItems } from "@/db/schema";
import { lt, eq, sql, desc, or, ilike } from "drizzle-orm";
import { z } from "zod";

// Re-export warehouse transactions for backward compatibility
export {
  createImportTransaction,
  createExportTransaction,
} from "./warehouse";

// Schema validation cho Thêm mới vật tư
export const createMaterialSchema = z.object({
  code: z
    .string()
    .min(2, "Mã vật tư phải có ít nhất 2 ký tự")
    .max(50, "Mã vật tư tối đa 50 ký tự")
    .transform((val) => val.trim().toUpperCase()),
  name: z
    .string()
    .min(2, "Tên vật tư phải có ít nhất 2 ký tự")
    .max(255, "Tên vật tư tối đa 255 ký tự")
    .transform((val) => val.trim()),
  unit: z
    .string()
    .min(1, "Vui lòng nhập đơn vị tính")
    .max(50, "Đơn vị tính tối đa 50 ký tự")
    .transform((val) => val.trim()),
  location: z
    .string()
    .max(255, "Vị trí tối đa 255 ký tự")
    .optional()
    .default("")
    .transform((val) => val.trim()),
  minStock: z
    .number()
    .min(0, "Ngưỡng tối thiểu không được âm")
    .default(0),
  maxStock: z
    .number()
    .min(0, "Ngưỡng tối đa không được âm")
    .default(0),
  currentStock: z
    .number()
    .min(0, "Tồn kho ban đầu không được âm")
    .default(0),
});

// Schema validation cho Cập nhật vật tư
export const updateMaterialSchema = z.object({
  id: z.string().min(1, "Thiếu ID vật tư"),
  code: z
    .string()
    .min(2, "Mã vật tư phải có ít nhất 2 ký tự")
    .max(50, "Mã vật tư tối đa 50 ký tự")
    .transform((val) => val.trim().toUpperCase()),
  name: z
    .string()
    .min(2, "Tên vật tư phải có ít nhất 2 ký tự")
    .max(255, "Tên vật tư tối đa 255 ký tự")
    .transform((val) => val.trim()),
  unit: z
    .string()
    .min(1, "Vui lòng nhập đơn vị tính")
    .max(50, "Đơn vị tính tối đa 50 ký tự")
    .transform((val) => val.trim()),
  location: z
    .string()
    .max(255)
    .optional()
    .default("")
    .transform((val) => val.trim()),
  minStock: z.number().min(0, "Ngưỡng tối thiểu không được âm"),
  maxStock: z.number().min(0, "Ngưỡng tối đa không được âm"),
  currentStock: z.number().min(0, "Tồn kho không được âm").optional(),
});

// Lấy toàn bộ danh mục vật tư
export const getAllMaterials = createServerFn({
  method: "GET",
}).handler(async () => {
  return db.select().from(materials).orderBy(materials.code);
});

// Lấy chi tiết vật tư theo ID
export const getMaterialById = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const [mat] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, data.id));

    if (!mat) {
      throw new Error("Không tìm thấy thông tin vật tư.");
    }

    return mat;
  });

// Lấy danh sách vật tư thiếu hàng (currentStock < minStock)
export const getLowStockMaterials = createServerFn({
  method: "GET",
}).handler(async () => {
  return db
    .select()
    .from(materials)
    .where(lt(materials.currentStock, materials.minStock))
    .orderBy(materials.code);
});

// Tạo mới vật tư (Task 2.1 & 2.2)
export const createMaterial = createServerFn({
  method: "POST",
})
  .validator(createMaterialSchema)
  .handler(async ({ data }) => {
    // 1. Kiểm tra mã vật tư đã tồn tại chưa
    const [existing] = await db
      .select()
      .from(materials)
      .where(eq(materials.code, data.code));

    if (existing) {
      throw new Error(`Mã vật tư "${data.code}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác!`);
    }

    if (data.maxStock > 0 && data.minStock > data.maxStock) {
      throw new Error("Ngưỡng tối thiểu (Min) không được lớn hơn ngưỡng tối đa (Max)!");
    }

    // 2. Thêm mới
    const [newMaterial] = await db
      .insert(materials)
      .values({
        code: data.code,
        name: data.name,
        unit: data.unit,
        location: data.location || null,
        minStock: data.minStock,
        maxStock: data.maxStock,
        currentStock: data.currentStock,
      })
      .returning();

    // 3. Nếu có tồn ban đầu > 0, tự động ghi nhận 1 giao dịch IMPORT mở đầu
    if (data.currentStock > 0) {
      await db.insert(transactions).values({
        type: "IMPORT",
        materialId: newMaterial.id,
        quantity: data.currentStock,
        customer: "Tồn kho ban đầu",
        note: "Khởi tạo tồn kho ban đầu khi tạo danh mục vật tư mới",
      });
    }

    return {
      success: true,
      material: newMaterial,
      message: `Đã tạo vật tư "${newMaterial.name}" (${newMaterial.code}) thành công!`,
    };
  });

// Cập nhật thông tin vật tư (Task 2.1 & 2.2)
export const updateMaterial = createServerFn({
  method: "POST",
})
  .validator(updateMaterialSchema)
  .handler(async ({ data }) => {
    // 1. Kiểm tra tồn tại
    const [existing] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, data.id));

    if (!existing) {
      throw new Error("Không tìm thấy vật tư cần cập nhật!");
    }

    // 2. Nếu thay đổi mã vật tư, kiểm tra trùng mã khác
    if (data.code !== existing.code) {
      const [duplicate] = await db
        .select()
        .from(materials)
        .where(eq(materials.code, data.code));

      if (duplicate) {
        throw new Error(`Mã vật tư "${data.code}" đã được sử dụng bởi vật tư khác!`);
      }
    }

    if (data.maxStock > 0 && data.minStock > data.maxStock) {
      throw new Error("Ngưỡng tối thiểu (Min) không được lớn hơn ngưỡng tối đa (Max)!");
    }

    const updateData: Record<string, any> = {
      code: data.code,
      name: data.name,
      unit: data.unit,
      location: data.location || null,
      minStock: data.minStock,
      maxStock: data.maxStock,
      updatedAt: new Date(),
    };

    if (data.currentStock !== undefined) {
      updateData.currentStock = data.currentStock;
    }

    const [updated] = await db
      .update(materials)
      .set(updateData)
      .where(eq(materials.id, data.id))
      .returning();

    return {
      success: true,
      material: updated,
      message: `Đã cập nhật thông tin vật tư "${updated.name}" (${updated.code})!`,
    };
  });

// Xóa vật tư (Task 2.1 & 2.2)
export const deleteMaterial = createServerFn({
  method: "POST",
})
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [mat] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, data.id));

    if (!mat) {
      throw new Error("Vật tư không tồn tại hoặc đã bị xóa!");
    }

    // Kiểm tra xem đã có giao dịch nhập/xuất chưa
    const txRecords = await db
      .select()
      .from(transactions)
      .where(eq(transactions.materialId, data.id))
      .limit(1);

    if (txRecords.length > 0) {
      throw new Error(
        `Không thể xóa vật tư "${mat.name}" (${mat.code}) vì đã có lịch sử nhập/xuất kho liên kết. Hãy chỉnh sửa thông tin hoặc điều chỉnh tồn kho thay vì xóa!`
      );
    }

    // Kiểm tra xem đã có phiếu đề xuất mua hàng chưa
    const procRecords = await db
      .select()
      .from(procurementItems)
      .where(eq(procurementItems.materialId, data.id))
      .limit(1);

    if (procRecords.length > 0) {
      throw new Error(
        `Không thể xóa vật tư "${mat.name}" (${mat.code}) vì đang có trong phiếu đề xuất mua sắm.`
      );
    }

    await db.delete(materials).where(eq(materials.id, data.id));

    return {
      success: true,
      message: `Đã xóa vật tư "${mat.name}" (${mat.code}) khỏi danh mục thành công.`,
    };
  });
