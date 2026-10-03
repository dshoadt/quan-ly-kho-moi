import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadCloud, Sparkles, FileText } from "lucide-react";

export const Route = createFileRoute("/ocr")({
  component: OCRPage,
});

function OCRPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Trích Xuất Chứng Từ Kho AI (OCR)
          </h1>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs">
            Giai đoạn tiếp theo
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tiếp nhận file Excel, PDF hóa đơn, trích xuất mã vật tư, số lượng và khách hàng tự động
        </p>
      </div>

      <Card className="border-dashed border-2 border-border/80 bg-card/40 backdrop-blur-sm p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">Kéo thả chứng từ vào đây hoặc chọn tệp</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Hỗ trợ định dạng PDF, Excel (.xlsx, .xls), ảnh chụp chứng từ phiếu giao hàng (.jpg, .png)
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <FileText className="h-4 w-4" />
            Chọn file mẫu Excel
          </Button>
          <Button size="sm" className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Sparkles className="h-4 w-4" />
            Tải lên & Phân tích AI
          </Button>
        </div>
      </Card>
    </div>
  );
}
