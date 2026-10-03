import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { materials, transactions } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { z } from "zod";

export const getAllTransactions = createServerFn({
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
    const baseQuery = db
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
        location: materials.location,
      })
      .from(transactions)
      .innerJoin(materials, eq(transactions.materialId, materials.id));

    if (data?.type && data.type !== "ALL") {
      return await baseQuery
        .where(eq(transactions.type, data.type))
        .orderBy(desc(transactions.createdAt));
    }

    return await baseQuery.orderBy(desc(transactions.createdAt));
  });
