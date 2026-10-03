import { useState, useMemo } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAllMaterials } from "@/server/functions/materials";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowUpDown,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  Package,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { MaterialModal, MaterialFormData } from "@/components/warehouse/MaterialModal";
import { DeleteMaterialDialog } from "@/components/warehouse/DeleteMaterialDialog";
import { TransactionModal, SimpleMaterial } from "@/components/warehouse/TransactionModal";

export const Route = createFileRoute("/materials")({
  loader: async () => {
    return await getAllMaterials();
  },
  component: MaterialsPage,
});

type SortField = "code" | "name" | "currentStock" | "minStock" | "maxStock";
type SortDirection = "asc" | "desc";
type FilterStatus = "ALL" | "LOW" | "NORMAL" | "OVER";

function MaterialsPage() {
  const materials = Route.useLoaderData();
  const router = useRouter();

  // State tìm kiếm & sắp xếp & bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialFormData | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<{
    id: string;
    code: string;
    name: string;
    currentStock: number;
    unit: string;
  } | null>(null);

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"IMPORT" | "EXPORT">("IMPORT");
  const [selectedTxMaterialId, setSelectedTxMaterialId] = useState<string | null>(null);

  const handleRefreshData = () => {
    router.invalidate();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setIsAddEditOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (m: (typeof materials)[0]) => {
    setEditingMaterial({
      id: m.id,
      code: m.code,
      name: m.name,
      unit: m.unit,
      location: m.location,
      minStock: m.minStock,
      maxStock: m.maxStock,
      currentStock: m.currentStock,
    });
    setIsAddEditOpen(true);
  };

  // Mở modal xóa
  const handleOpenDelete = (m: (typeof materials)[0]) => {
    setDeletingMaterial({
      id: m.id,
      code: m.code,
      name: m.name,
      currentStock: m.currentStock,
      unit: m.unit,
    });
    setIsDeleteOpen(true);
  };

  // Mở modal Nhập / Xuất nhanh từ hàng
  const handleQuickTransaction = (type: "IMPORT" | "EXPORT", materialId: string) => {
    setTransactionType(type);
    setSelectedTxMaterialId(materialId);
    setIsTransactionOpen(true);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    let lowCount = 0;
    let overCount = 0;
    let normalCount = 0;

    materials.forEach((m) => {
      if (m.currentStock < m.minStock) {
        lowCount++;
      } else if (m.maxStock > 0 && m.currentStock > m.maxStock) {
        overCount++;
      } else {
        normalCount++;
      }
    });

    return {
      total: materials.length,
      low: lowCount,
      over: overCount,
      normal: normalCount,
    };
  }, [materials]);

  // Lọc và Sắp xếp
  const filteredAndSorted = useMemo(() => {
    let result = [...materials];

    // Lọc theo từ khóa
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.code.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          (m.location && m.location.toLowerCase().includes(q))
      );
    }

    // Lọc theo trạng thái tồn kho
    if (statusFilter === "LOW") {
      result = result.filter((m) => m.currentStock < m.minStock);
    } else if (statusFilter === "OVER") {
      result = result.filter((m) => m.maxStock > 0 && m.currentStock > m.maxStock);
    } else if (statusFilter === "NORMAL") {
      result = result.filter(
        (m) => m.currentStock >= m.minStock && (m.maxStock === 0 || m.currentStock <= m.maxStock)
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [materials, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút thao tác chính */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
            <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Danh Mục Vật Tư Kho
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý mã định danh, định mức an toàn Min/Max và thực hiện luân chuyển nhập/xuất trực tiếp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleQuickTransaction("IMPORT", "")}
            variant="outline"
            className="h-9 gap-1.5 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Nhập kho
          </Button>

          <Button
            onClick={() => handleQuickTransaction("EXPORT", "")}
            variant="outline"
            className="h-9 gap-1.5 text-xs border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Xuất kho
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm vật tư mới
          </Button>
        </div>
      </div>

      {/* Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3 transition-all ${
            statusFilter === "ALL"
              ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng mặt hàng</span>
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-foreground">
            {stats.total}
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter("LOW");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3 transition-all ${
            statusFilter === "LOW"
              ? "border-rose-500/50 bg-rose-500/15 ring-1 ring-rose-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span>Thiếu hàng (&lt; Min)</span>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {stats.low}
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter("NORMAL");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3 transition-all ${
            statusFilter === "NORMAL"
              ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Chuẩn định mức</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.normal}
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter("OVER");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3 transition-all ${
            statusFilter === "OVER"
              ? "border-blue-500/50 bg-blue-500/15 ring-1 ring-blue-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span>Vượt Max (&gt; Max)</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {stats.over}
          </div>
        </button>
      </div>

      {/* Bảng Dữ Liệu */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm mã VT, tên hoặc vị trí kho..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 text-xs bg-muted/40"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Hiển thị: <strong className="text-foreground">{filteredAndSorted.length}</strong> /{" "}
                {materials.length} vật tư
              </span>
              {statusFilter !== "ALL" && (
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  (Xóa lọc)
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[100px] text-xs font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("code")}
                      className="p-0 font-semibold text-xs text-foreground"
                    >
                      Mã VT
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold min-w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="p-0 font-semibold text-xs text-foreground"
                    >
                      Tên vật tư
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold">ĐVT</TableHead>
                  <TableHead className="text-xs font-semibold">Vị trí kho</TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("currentStock")}
                      className="p-0 font-semibold text-xs text-foreground ml-auto"
                    >
                      Hiện tồn
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">Mức Min</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Mức Max</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Định mức</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-xs text-muted-foreground"
                    >
                      Không tìm thấy vật tư nào phù hợp với bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((m) => {
                    const isLow = m.currentStock < m.minStock;
                    const isOver = m.maxStock > 0 && m.currentStock > m.maxStock;

                    return (
                      <TableRow
                        key={m.id}
                        className="border-border/40 hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {m.code}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {m.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.location || "Chưa phân vị trí"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">
                          <span
                            className={
                              isLow
                                ? "text-rose-600 dark:text-rose-400"
                                : isOver
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-foreground"
                            }
                          >
                            {m.currentStock.toLocaleString("vi-VN")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {m.minStock.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {m.maxStock.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLow ? (
                            <Badge
                              variant="destructive"
                              className="gap-1 text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Thiếu hàng
                            </Badge>
                          ) : isOver ? (
                            <Badge className="gap-1 text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                              <TrendingUp className="h-3 w-3" />
                              Vượt Max
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Chuẩn
                            </Badge>
                          )}
                        </TableCell>

                        {/* Thao tác CRUD & Nhập/Xuất nhanh */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Nhập kho nhanh vật tư này"
                              onClick={() => handleQuickTransaction("IMPORT", m.id)}
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            >
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Xuất kho nhanh vật tư này"
                              onClick={() => handleQuickTransaction("EXPORT", m.id)}
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Chỉnh sửa thông tin"
                              onClick={() => handleOpenEdit(m)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Xóa vật tư"
                              onClick={() => handleOpenDelete(m)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phân trang */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-xs">
            <div className="text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2.5 text-xs"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2.5 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Thêm / Sửa vật tư */}
      <MaterialModal
        open={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        material={editingMaterial}
        onSuccess={handleRefreshData}
      />

      {/* Modal Xóa vật tư */}
      <DeleteMaterialDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        material={deletingMaterial}
        onSuccess={handleRefreshData}
      />

      {/* Modal Nhập / Xuất kho nhanh */}
      <TransactionModal
        open={isTransactionOpen}
        onOpenChange={setIsTransactionOpen}
        type={transactionType}
        materialsList={materials}
        selectedMaterialId={selectedTxMaterialId}
        onSuccess={handleRefreshData}
      />
    </div>
  );
}
