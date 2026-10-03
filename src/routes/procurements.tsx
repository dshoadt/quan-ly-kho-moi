import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAllProcurements } from "@/server/functions/procurements";
import { getAllMaterials } from "@/server/functions/materials";
import {
  Card,
  CardContent,
  CardHeader,
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
import { Plus, Calendar, Printer, FileText, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { ProcurementDrawer } from "@/components/procurement/ProcurementDrawer";

export const Route = createFileRoute("/procurements")({
  loader: async () => {
    const [procurements, materials] = await Promise.all([
      getAllProcurements(),
      getAllMaterials(),
    ]);
    return { procurements, materials };
  },
  component: ProcurementsPage,
});

function ProcurementsPage() {
  const { procurements, materials } = Route.useLoaderData();
  const router = useRouter();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRefresh = () => {
    router.invalidate();
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Tạo phiếu đề xuất */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Kế Hoạch & Đề Xuất Mua Hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lập phiếu đề xuất tự động từ phân tích thiếu hụt tồn kho, tích hợp in phiếu và theo dõi tiến độ duyệt
          </p>
        </div>

        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Tạo phiếu đề xuất mới
        </Button>
      </div>

      {/* Danh sách Phiếu đề xuất */}
      <div className="space-y-4">
        {procurements.length === 0 ? (
          <Card className="border-border/60 bg-card/60 p-12 text-center text-xs text-muted-foreground space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Chưa có phiếu đề xuất mua hàng nào</p>
              <p className="text-muted-foreground mt-1">Bấm vào nút "Tạo phiếu đề xuất mới" để mở drawer lập phiếu</p>
            </div>
            <Button
              onClick={() => setIsDrawerOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Lập phiếu ngay
            </Button>
          </Card>
        ) : (
          procurements.map((proc) => (
            <Card key={proc.id} className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {proc.code}
                        </span>
                        <Badge
                          className={`text-[10px] font-semibold ${
                            proc.priority === "URGENT"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {proc.priority === "URGENT" ? "CẦN GẤP" : "BÌNH THƯỜNG"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-medium border-border">
                          {proc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {proc.note || "Đề xuất vật tư định kỳ"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      Giao dự kiến:{" "}
                      {proc.expectedDate
                        ? new Date(proc.expectedDate).toLocaleDateString("vi-VN")
                        : "Chưa hẹn"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      In phiếu
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-3 p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent text-xs">
                      <TableHead className="w-[100px] text-xs font-semibold">Mã VT</TableHead>
                      <TableHead className="text-xs font-semibold">Tên vật tư</TableHead>
                      <TableHead className="text-xs font-semibold text-right">SL Cần Mua</TableHead>
                      <TableHead className="text-xs font-semibold">ĐVT</TableHead>
                      <TableHead className="text-xs font-semibold">Nhà cung cấp dự kiến</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Mức ưu tiên</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proc.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">
                          Phiếu chưa có chi tiết danh mục vật tư.
                        </TableCell>
                      </TableRow>
                    ) : (
                      proc.items.map((item) => (
                        <TableRow key={item.id} className="border-border/30 hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-medium text-foreground">
                            {item.materialCode}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {item.materialName}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {item.quantity.toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.materialUnit}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.supplier || "Chưa chỉ định"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                item.priority === "URGENT"
                                  ? "border-rose-500/30 text-rose-600 font-semibold"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {item.priority === "URGENT" ? "Gấp" : "Thường"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Drawer Nhập Thông Tin Phiếu Đề Xuất */}
      <ProcurementDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        materialsList={materials}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
