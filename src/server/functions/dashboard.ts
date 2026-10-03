import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { materials, transactions, procurements, procurementItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export interface DashboardMetrics {
  totalMaterials: number;
  lowStockCount: number;
  overStockCount: number;
  normalStockCount: number;
  pendingProcurementsCount: number;
  totalTransactionsCount: number;
}

export interface LowStockItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  location: string | null;
  minStock: number;
  maxStock: number;
  currentStock: number;
  deficit: number;
}

export interface RecentTransactionItem {
  id: string;
  type: string;
  quantity: number;
  customer: string | null;
  note: string | null;
  createdAt: Date;
  materialCode: string;
  materialName: string;
  materialUnit: string;
}

export interface RecentProcurementItem {
  id: string;
  code: string;
  status: string;
  priority: string;
  orderDate: Date;
  expectedDate: Date | null;
  note: string | null;
  itemCount: number;
}

export const getDashboardData = createServerFn({
  method: "GET",
}).handler(async () => {
  // 1. Fetch all materials
  const allMaterials = await db.select().from(materials);

  let lowStockCount = 0;
  let overStockCount = 0;
  let normalStockCount = 0;
  const lowStockList: LowStockItem[] = [];

  for (const m of allMaterials) {
    if (m.currentStock < m.minStock) {
      lowStockCount++;
      lowStockList.push({
        id: m.id,
        code: m.code,
        name: m.name,
        unit: m.unit,
        location: m.location,
        minStock: m.minStock,
        maxStock: m.maxStock,
        currentStock: m.currentStock,
        deficit: Math.max(0, m.minStock - m.currentStock),
      });
    } else if (m.currentStock > m.maxStock && m.maxStock > 0) {
      overStockCount++;
    } else {
      normalStockCount++;
    }
  }

  // Sort low stock by deficit descending
  lowStockList.sort((a, b) => b.deficit - a.deficit);

  // 2. Fetch recent transactions with material details
  const rawTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      quantity: transactions.quantity,
      customer: transactions.customer,
      note: transactions.note,
      createdAt: transactions.createdAt,
      materialCode: materials.code,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(transactions)
    .innerJoin(materials, eq(transactions.materialId, materials.id))
    .orderBy(desc(transactions.createdAt))
    .limit(8);

  // 3. Procurements count & list
  const allProcurements = await db
    .select()
    .from(procurements)
    .orderBy(desc(procurements.createdAt))
    .limit(5);

  const pendingProcurements = allProcurements.filter(
    (p) => p.status === "DRAFT" || p.status === "SUBMITTED"
  );

  const procurementsWithCounts: RecentProcurementItem[] = await Promise.all(
    allProcurements.map(async (p) => {
      const items = await db
        .select({ id: procurementItems.id })
        .from(procurementItems)
        .where(eq(procurementItems.procurementId, p.id));
      return {
        id: p.id,
        code: p.code,
        status: p.status,
        priority: p.priority,
        orderDate: p.orderDate,
        expectedDate: p.expectedDate,
        note: p.note,
        itemCount: items.length,
      };
    })
  );

  const metrics: DashboardMetrics = {
    totalMaterials: allMaterials.length,
    lowStockCount,
    overStockCount,
    normalStockCount,
    pendingProcurementsCount: pendingProcurements.length,
    totalTransactionsCount: rawTransactions.length,
  };

  return {
    metrics,
    lowStockMaterials: lowStockList,
    recentTransactions: rawTransactions,
    recentProcurements: procurementsWithCounts,
  };
});
