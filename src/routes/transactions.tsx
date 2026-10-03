import { useState, useMemo } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAllTransactions } from "@/server/functions/transactions";
import { getAllMaterials } from "@/server/functions/materials";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  Search,
  ArrowLeftRight,
  Boxes,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { TransactionModal } from "@/components/warehouse/TransactionModal";

export const Route = createFileRoute("/transactions")({
  loader: async () => {
    const [transactions, materials] = await Promise.all([
      getAllTransactions(),
      getAllMaterials(),
    ]);
    return { transactions, materials };
  },
  component: TransactionsPage,
});

type FilterType = "ALL" | "IMPORT" | "EXPORT";
type SortField = "createdAt" | "quantity" | "materialCode" | "materialName";
type SortDirection = "asc" | "desc";

function TransactionsPage() {
  const { transactions, materials } = Route.useLoaderData();
  const router = useRouter();

  // State
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"IMPORT" | "EXPORT">("IMPORT");

  const handleRefresh = () => {
    router.invalidate();
  };

  const handleOpenModal = (type: "IMPORT" | "EXPORT") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    let importCount = 0;
    let exportCount = 0;
    let totalImportQty = 0;
    let totalExportQty = 0;
    const partnersSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.type === "IMPORT") {
        importCount++;
        totalImportQty += tx.quantity;
      } else {
        exportCount++;
        totalExportQty += tx.quantity;
      }
      if (tx.customer?.trim()) {
        partnersSet.add(tx.customer.trim());
      }
    });

    return {
      totalCount: transactions.length,
      importCount,
      exportCount,
      totalImportQty,
      totalExportQty,
      partnerCount: partnersSet.size,
    };
  }, [transactions]);

  // Lọc và Sắp xếp
  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    // Lọc theo loại GD
    if (filterType !== "ALL") {
      result = result.filter((tx) => tx.type === filterType);
    }

    // Lọc theo từ khóa
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.materialCode.toLowerCase().includes(q) ||
          tx.materialName.toLowerCase().includes(q) ||
          (tx.customer && tx.customer.toLowerCase().includes(q)) ||
          (tx.note && tx.note.toLowerCase().includes(q))
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (sortField === "quantity") {
        return sortDirection === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      }

      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    return result;
  }, [transactions, filterType, searchTerm, sortField, sortDirection]);

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
            <ArrowLeftRight className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Nhật Ký Nhập & Xuất Kho
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lịch sử giao dịch biến động tồn kho, chứng từ đối tác và tự động cập nhật số dư kho tức thời
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenModal("IMPORT")}
            className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Tạo phiếu Nhập kho
          </Button>
          <Button
            onClick={() => handleOpenModal("EXPORT")}
            className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Tạo phiếu Xuất kho
          </Button>
        </div>
      </div>

      {/* Thẻ tóm tắt chỉ số giao dịch */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setFilterType("ALL");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterType === "ALL"
              ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng giao dịch</span>
            <Layers className="h-4 w-4" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-foreground">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Tất cả các đợt phát sinh
          </div>
        </button>

        <button
          onClick={() => {
            setFilterType("IMPORT");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterType === "IMPORT"
              ? "border-emerald-500/50 bg-emerald-500/15 ring-1 ring-emerald-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Phiếu Nhập kho</span>
            <ArrowDownRight className="h-4 w-4" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.importCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Tổng nhập: {stats.totalImportQty.toLocaleString("vi-VN")} đơn vị
          </div>
        </button>

        <button
          onClick={() => {
            setFilterType("EXPORT");
            setCurrentPage(1);
          }}
          className={`text-left rounded-xl border p-3.5 transition-all ${
            filterType === "EXPORT"
              ? "border-blue-500/50 bg-blue-500/15 ring-1 ring-blue-500/30 shadow-xs"
              : "border-border/60 bg-card/60 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span>Phiếu Xuất kho</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {stats.exportCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Tổng xuất: {stats.totalExportQty.toLocaleString("vi-VN")} đơn vị
          </div>
        </button>

        <div className="rounded-xl border border-border/60 bg-card/60 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Đối tác / Công trình</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-foreground">
            {stats.partnerCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Khách hàng & NCC giao dịch
          </div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Giao Dịch */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm mã VT, tên, đối tác, ghi chú..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 text-xs bg-muted/40"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Tab phân loại nhanh */}
              <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("ALL");
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    filterType === "ALL"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("IMPORT");
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    filterType === "IMPORT"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nhập kho
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("EXPORT");
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    filterType === "EXPORT"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Xuất kho
                </button>
              </div>

              <div className="text-xs text-muted-foreground hidden sm:block">
                ({filteredAndSorted.length} kết quả)
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[110px] text-xs font-semibold">Loại GD</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("materialCode")}
                      className="p-0 font-semibold text-xs text-foreground"
                    >
                      Mã VT
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold min-w-[180px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("materialName")}
                      className="p-0 font-semibold text-xs text-foreground"
                    >
                      Tên vật tư
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("quantity")}
                      className="p-0 font-semibold text-xs text-foreground ml-auto"
                    >
                      Số lượng
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs font-semibold min-w-[160px]">
                    Khách hàng / Đối tác
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Ghi chú chứng từ</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("createdAt")}
                      className="p-0 font-semibold text-xs text-foreground ml-auto"
                    >
                      Thời gian
                      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-xs text-muted-foreground"
                    >
                      Không có giao dịch nào phù hợp với bộ lọc tìm kiếm.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((tx) => {
                    const isImport = tx.type === "IMPORT";
                    return (
                      <TableRow
                        key={tx.id}
                        className="border-border/40 hover:bg-muted/40 transition-colors"
                      >
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-semibold gap-1 ${
                              isImport
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {isImport ? (
                              <>
                                <ArrowDownRight className="h-3 w-3" />
                                NHẬP KHO
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="h-3 w-3" />
                                XUẤT KHO
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {tx.materialCode}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {tx.materialName}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">
                          <span
                            className={
                              isImport
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-blue-600 dark:text-blue-400"
                            }
                          >
                            {isImport ? "+" : "-"}
                            {tx.quantity.toLocaleString("vi-VN")} {tx.materialUnit}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.customer || (
                            <span className="italic text-muted-foreground/60">
                              Nội bộ công ty
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                          {tx.note || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground pr-4 font-mono">
                          {new Date(tx.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

      {/* Modal Nhập / Xuất kho */}
      <TransactionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        type={modalType}
        materialsList={materials}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
