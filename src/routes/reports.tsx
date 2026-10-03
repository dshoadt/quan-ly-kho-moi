import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardData } from "@/server/functions/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  loader: async () => {
    return await getDashboardData();
  },
  component: ReportsPage,
});

function ReportsPage() {
  const { metrics, lowStockMaterials } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Báo Cáo Kiểm Soát Định Mức Kho
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Thống kê tình hình thừa / thiếu vật tư theo quy trình kiểm soát định mức kho
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Xuất báo cáo Excel
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Tỷ lệ đạt chuẩn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.totalMaterials > 0
                ? Math.round((metrics.normalStockCount / metrics.totalMaterials) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.normalStockCount} / {metrics.totalMaterials} mặt hàng nằm trong giới hạn an toàn
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/30 bg-rose-500/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-rose-700 dark:text-rose-400">Thiếu hàng (Dưới Min)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-700 dark:text-rose-400">
              {metrics.lowStockCount}
            </div>
            <p className="text-xs text-rose-600/80 mt-1">
              Cần khởi tạo đề xuất mua hàng ngay
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-blue-700 dark:text-blue-400">Thừa hàng (Vượt Max)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {metrics.overStockCount}
            </div>
            <p className="text-xs text-blue-600/80 mt-1">
              Cần tạm hoãn nhập thêm để giảm tồn đọng vốn
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Phân Tích Tồn Kho Chi Tiết</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Bảng đối soát ngưỡng định mức Min / Max đối với toàn bộ danh mục vật tư
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockMaterials.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.code}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {item.name}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      Thiếu hụt
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hiện tồn: {item.currentStock} {item.unit} • Định mức Min: {item.minStock} {item.unit}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Thiếu {item.deficit} {item.unit}
                  </div>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 p-0">
                    <Link to="/procurements">Lập đề xuất mua</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
