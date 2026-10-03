import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createImportTransaction,
  createExportTransaction,
} from "@/server/functions/warehouse";
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Package,
  Loader2,
  Building2,
  FileText,
} from "lucide-react";

export interface SimpleMaterial {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location?: string | null;
}

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "IMPORT" | "EXPORT";
  materialsList: SimpleMaterial[];
  selectedMaterialId?: string | null;
  onSuccess?: () => void;
}

export function TransactionModal({
  open,
  onOpenChange,
  type,
  materialsList,
  selectedMaterialId,
  onSuccess,
}: TransactionModalProps) {
  const isImport = type === "IMPORT";

  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize selected material when drawer opens
  useEffect(() => {
    if (open) {
      if (selectedMaterialId) {
        setMaterialId(selectedMaterialId);
      } else if (materialsList.length > 0 && !materialId) {
        setMaterialId(materialsList[0].id);
      }
      setQuantity("");
      setCustomer("");
      setNote("");
      setErrorMsg(null);
    }
  }, [open, selectedMaterialId, materialsList]);

  // Selected material details
  const selectedMaterial = useMemo(() => {
    return materialsList.find((m) => m.id === materialId);
  }, [materialsList, materialId]);

  const numQuantity = typeof quantity === "number" ? quantity : 0;

  // Real-time projected stock
  const currentStock = selectedMaterial?.currentStock ?? 0;
  const projectedStock = isImport
    ? currentStock + numQuantity
    : currentStock - numQuantity;

  // Validation conditions
  const isStockInsufficient = !isImport && numQuantity > currentStock;
  const isBelowMin = !isImport && selectedMaterial && projectedStock < selectedMaterial.minStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!materialId) {
      setErrorMsg("Vui lòng chọn vật tư giao dịch");
      return;
    }

    if (!numQuantity || numQuantity <= 0) {
      setErrorMsg("Số lượng phải lớn hơn 0");
      return;
    }

    if (!isImport && numQuantity > currentStock) {
      setErrorMsg(`Không đủ tồn kho để xuất! Hiện tại chỉ còn ${currentStock} ${selectedMaterial?.unit}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isImport) {
        const res = await createImportTransaction({
          data: {
            materialId,
            quantity: numQuantity,
            customer: customer.trim() || undefined,
            note: note.trim() || undefined,
          },
        });
        toast.success(res.message);
      } else {
        const res = await createExportTransaction({
          data: {
            materialId,
            quantity: numQuantity,
            customer: customer.trim() || undefined,
            note: note.trim() || undefined,
          },
        });
        toast.success(res.message);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || "Đã xảy ra lỗi khi tạo phiếu!";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (add: number) => {
    const currentVal = typeof quantity === "number" ? quantity : 0;
    setQuantity(currentVal + add);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl flex flex-col p-0 border-l border-border/70 bg-card/95 backdrop-blur-md overflow-hidden"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-5 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            {isImport ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            )}
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {isImport ? "Lập Phiếu Nhập Kho" : "Lập Phiếu Xuất Kho"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {isImport
                  ? "Ghi nhận vật tư nhập vào kho, cập nhật tăng lượng tồn và lưu nhật ký chứng từ."
                  : "Ghi nhận vật tư xuất kho, tự động kiểm tra tồn kho và trừ số lượng khả dụng."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Chọn vật tư */}
            <div className="space-y-1.5">
              <Label htmlFor="materialSelect" className="text-xs font-semibold text-foreground">
                Vật tư cần {isImport ? "nhập" : "xuất"} <span className="text-rose-500">*</span>
              </Label>
              <select
                id="materialSelect"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                disabled={isSubmitting}
              >
                <option value="" disabled>-- Chọn vật tư --</option>
                {materialsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} — Tồn: {m.currentStock.toLocaleString("vi-VN")} {m.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Card trạng thái vật tư đã chọn */}
            {selectedMaterial && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {selectedMaterial.name}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/40">
                    {selectedMaterial.code}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Hiện tồn:</span>{" "}
                    <strong className="font-mono text-foreground text-xs">
                      {selectedMaterial.currentStock.toLocaleString("vi-VN")} {selectedMaterial.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mức Min:</span>{" "}
                    <span className="font-mono text-muted-foreground">
                      {selectedMaterial.minStock.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vị trí:</span>{" "}
                    <span className="text-foreground">
                      {selectedMaterial.location || "Chưa gán"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Số lượng giao dịch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity" className="text-xs font-semibold text-foreground">
                  Số lượng {isImport ? "nhập" : "xuất"} ({selectedMaterial?.unit || "ĐVT"}){" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  {[10, 50, 100, 500].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleQuickAdd(step)}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                      +{step}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                id="quantity"
                type="number"
                min="0.001"
                step="any"
                placeholder={`Nhập số lượng ${isImport ? "nhập vào" : "xuất ra"}...`}
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setQuantity(val);
                }}
                className="font-mono text-sm font-bold h-9"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Thông báo kiểm tra tồn kho & Dự phóng số lượng sau giao dịch */}
            {selectedMaterial && numQuantity > 0 && (
              <div
                className={`rounded-xl border p-3.5 text-xs space-y-1.5 transition-all ${
                  isStockInsufficient
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : isBelowMin
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5">
                    {isStockInsufficient ? (
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    ) : isBelowMin ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    Tồn kho dự kiến sau {isImport ? "nhập" : "xuất"}:
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {projectedStock.toLocaleString("vi-VN")} {selectedMaterial.unit}
                  </span>
                </div>

                {isStockInsufficient && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    ⛔ Lỗi: Không thể xuất vượt quá tồn kho khả dụng ({currentStock} {selectedMaterial.unit})!
                  </p>
                )}

                {isBelowMin && !isStockInsufficient && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    ⚠️ Lưu ý: Tồn kho sau xuất sẽ tụt dưới mức an toàn Min ({selectedMaterial.minStock} {selectedMaterial.unit}).
                  </p>
                )}
              </div>
            )}

            {/* Khách hàng / Nhà cung cấp */}
            <div className="space-y-1.5">
              <Label htmlFor="customer" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {isImport ? "Nhà cung cấp / Đơn vị giao hàng" : "Khách hàng / Công trình nhận"}
              </Label>
              <Input
                id="customer"
                placeholder={
                  isImport
                    ? "VD: Công ty Thép Hòa Phát, Đại lý Minh Hưng..."
                    : "VD: Công trình KCN VSIP, Dự án Ecopark..."
                }
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Ghi chú chứng từ / Mục đích
              </Label>
              <Textarea
                id="note"
                placeholder="VD: Nhập theo Hóa đơn GTGT số 00482, Xuất phục vụ đổ bê tông móng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-xs resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Drawer Footer */}
          <SheetFooter className="p-4 border-t border-border/50 bg-muted/20 shrink-0 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isStockInsufficient || !numQuantity}
              className={`text-xs text-white gap-1.5 ${
                isImport
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang ghi nhận...
                </>
              ) : isImport ? (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Xác nhận Nhập kho
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Xác nhận Xuất kho
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
