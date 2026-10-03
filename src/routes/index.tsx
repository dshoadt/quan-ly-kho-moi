import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardData } from "@/server/functions/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async () => {
    return await getDashboardData();
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { metrics, lowStockMaterials, recentTransactions, recentProcurements } =
    Route.useLoaderData();

  return (
    <div className="space-y-6 pb-10">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Bảng Điều Khiển Tồn Kho & Vật Tư
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Giám sát định mức min/max, cảnh báo thiếu hàng và điều phối kế hoạch mua sắm tự động
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Link to="/procurements">
              <PlusCircle className="h-3.5 w-3.5" />
              Lập phiếu đề xuất
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng danh mục vật tư */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng danh mục
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalMaterials} <span className="text-sm font-normal text-muted-foreground">mặt hàng</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Warehouse className="h-3 w-3" />
                Kho Trung Tâm
              </span>
              <span>•</span>
              <span>{metrics.normalStockCount} mức chuẩn</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Cảnh báo thiếu hàng (Dưới Min) */}
        <Card className="border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/15 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Cảnh báo thiếu hàng
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {metrics.lowStockCount}{" "}
              <span className="text-sm font-normal text-rose-600/80">vật tư dưới Min</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-700/90 dark:text-rose-400/90 font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Cần bổ sung & mua hàng gấp</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Vật tư thừa (Vượt Max) */}
        <Card className="border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/15 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Tồn kho vượt mức
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {metrics.overStockCount}{" "}
              <span className="text-sm font-normal text-blue-600/80">vật tư vượt Max</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700/90 dark:text-blue-400/90">
              <span>Định mức tối đa bị vượt</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Đề xuất mua hàng */}
        <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Phiếu đề xuất mua
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {metrics.pendingProcurementsCount}{" "}
              <span className="text-sm font-normal text-amber-600/80">phiếu chờ duyệt</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700/90 dark:text-amber-400/90">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Theo quy trình tự động hóa</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Cảnh báo vật tư thiếu & Hoạt động gần đây */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column (4 cols): Bảng vật tư thiếu hàng cần mua */}
        <Card className="lg:col-span-4 border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  Danh Sách Vật Tư Cần Đặt Mua Gấp
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Các mặt hàng có số lượng tồn kho thực tế dưới ngưỡng an toàn tối thiểu (Min)
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs">
                {lowStockMaterials.length} mặt hàng
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="w-[85px] text-xs font-semibold">Mã VT</TableHead>
                    <TableHead className="text-xs font-semibold">Tên vật tư</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tồn kho</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Min</TableHead>
                    <TableHead className="text-xs font-semibold text-right text-rose-600 dark:text-rose-400">Thiếu</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        Kho đạt định mức an toàn, không có mặt hàng thiếu hụt.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockMaterials.map((item) => (
                      <TableRow key={item.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {item.code}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-foreground">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            ĐVT: {item.unit} • {item.location || "Chưa xếp vị trí"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {item.currentStock.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {item.minStock.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                          +{item.deficit.toLocaleString("vi-VN")} {item.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Link to="/procurements">
                              Lập đề xuất
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (3 cols): Giao dịch gần nhất & Đề xuất */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recent Transactions Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Giao Dịch Gần Nhất
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Nhập kho và xuất kho phát sinh hôm nay
                  </CardDescription>
                </div>
                <Button asChild variant="link" size="sm" className="h-7 text-xs text-emerald-600 dark:text-emerald-400 p-0">
                  <Link to="/transactions">Xem tất cả</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {recentTransactions.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  Chưa có giao dịch nhập xuất nào phát sinh.
                </p>
              ) : (
                recentTransactions.map((tx) => {
                  const isImport = tx.type === "IMPORT";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 p-2.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-md ${
                            isImport
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isImport ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {tx.materialName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {tx.customer || "Nội bộ"} • {new Date(tx.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold ${
                            isImport
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isImport ? "+" : "-"}
                          {tx.quantity} {tx.materialUnit}
                        </span>
                        <div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            {isImport ? "Nhập kho" : "Xuất kho"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Procurements Card */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Phiếu Đề Xuất Mua Hàng
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Trạng thái các phiếu lập kế hoạch cung ứng
                  </CardDescription>
                </div>
                <Button asChild variant="link" size="sm" className="h-7 text-xs text-amber-600 dark:text-amber-400 p-0">
                  <Link to="/procurements">Chi tiết</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {recentProcurements.map((proc) => (
                <div
                  key={proc.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-2.5"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {proc.code}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {proc.note || "Đề xuất định kỳ"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] font-semibold ${
                        proc.priority === "URGENT"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {proc.priority === "URGENT" ? "Cần gấp" : "Bình thường"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-border"
                    >
                      {proc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
