import { useState, useEffect } from "react";
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
  createProcurement,
  getLowStockSuggestions,
} from "@/server/functions/procurements";
import {
  ClipboardList,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  AlertCircle,
  Building,
  Loader2,
  Package,
} from "lucide-react";

export interface ProcurementMaterialOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
}

export interface ProcurementDraftItem {
  id: string; // client temporary id
  materialId: string;
  quantity: number;
  supplier: string;
  priority: "NORMAL" | "URGENT";
}

interface ProcurementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialsList: ProcurementMaterialOption[];
  onSuccess?: () => void;
}

export function ProcurementDrawer({
  open,
  onOpenChange,
  materialsList,
  onSuccess,
}: ProcurementDrawerProps) {
  const [code, setCode] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ProcurementDraftItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Khởi tạo mã phiếu và ngày dự kiến khi mở Drawer
  useEffect(() => {
    if (open) {
      const randomSuffix = String(Math.floor(100 + Math.random() * 900));
      setCode(`DX-${new Date().getFullYear()}-${randomSuffix}`);
      setPriority("NORMAL");

      // Ngày giao dự kiến mặc định là 30 ngày sau
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setExpectedDate(defaultDate.toISOString().split("T")[0]);

      setNote("");
      setErrorMsg(null);

      // Thêm 1 dòng vật tư trống mở đầu
      if (materialsList.length > 0) {
        setItems([
          {
            id: `item-${Date.now()}`,
            materialId: materialsList[0].id,
            quantity: 10,
            supplier: "",
            priority: "NORMAL",
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [open, materialsList]);

  // Thêm dòng vật tư mới
  const handleAddItem = () => {
    if (materialsList.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        materialId: materialsList[0].id,
        quantity: 10,
        supplier: "",
        priority: "NORMAL",
      },
    ]);
  };

  // Xóa dòng vật tư
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.warning("Phiếu đề xuất cần có tối thiểu 1 vật tư!");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Cập nhật thông tin dòng vật tư
  const handleUpdateItem = (
    id: string,
    field: keyof ProcurementDraftItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Nạp tự động các vật tư thiếu hàng (< Min)
  const handleAutoLoadLowStock = async () => {
    try {
      const suggestions = await getLowStockSuggestions();
      if (suggestions.length === 0) {
        toast.info("Tất cả vật tư hiện tại đều đạt định mức an toàn, không có hàng thiếu.");
        return;
      }

      const newItems: ProcurementDraftItem[] = suggestions.map((s, idx) => ({
        id: `suggest-${idx}-${Date.now()}`,
        materialId: s.materialId,
        quantity: s.suggestedQuantity,
        supplier: "",
        priority: "URGENT",
      }));

      setItems(newItems);
      setPriority("URGENT");
      setNote(
        `Đề xuất mua sắm bổ sung khẩn cấp cho ${suggestions.length} vật tư dưới ngưỡng tồn kho an toàn Min.`
      );
      toast.success(
        `Đã tự động nạp ${suggestions.length} vật tư thiếu hàng với mức tính toán bù tồn Max!`
      );
    } catch (err: any) {
      toast.error("Không thể lấy danh sách đề xuất tự động.");
    }
  };

  // Xử lý gửi phiếu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Vui lòng nhập mã phiếu đề xuất");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Phiếu đề xuất phải có ít nhất 1 vật tư");
      return;
    }

    // Validate từng item
    for (let i = 0; i < items.length; i++) {
      if (!items[i].materialId) {
        setErrorMsg(`Dòng thứ ${i + 1} chưa chọn vật tư`);
        return;
      }
      if (!items[i].quantity || items[i].quantity <= 0) {
        setErrorMsg(`Dòng thứ ${i + 1} có số lượng cần mua không hợp lệ (> 0)`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await createProcurement({
        data: {
          code: cleanCode,
          priority,
          expectedDate: expectedDate || null,
          note: note.trim() || undefined,
          items: items.map((it) => ({
            materialId: it.materialId,
            quantity: Number(it.quantity),
            supplier: it.supplier?.trim() || undefined,
            priority: it.priority,
          })),
        },
      });

      toast.success(res.message);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || "Đã xảy ra lỗi khi tạo phiếu đề xuất!";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 border-l border-border/70 bg-card/95 backdrop-blur-md overflow-hidden"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-5 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Lập Phiếu Đề Xuất Mua Hàng
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Nhập danh mục vật tư cần mua sắm, dự kiến nhà cung ứng và hạn giao hàng
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Smart Helper Button */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gợi ý lập phiếu tự động từ kho
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tự động quét các mặt hàng dưới mức Min và tính toán số lượng cần bù về mức Max
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoLoadLowStock}
                className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Nạp vật tư thiếu hàng
              </Button>
            </div>

            {/* Thông tin chung của phiếu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mã phiếu */}
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold text-foreground">
                  Mã phiếu đề xuất <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="VD: DX-2026-003"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-xs uppercase"
                  disabled={isSubmitting}
                />
              </div>

              {/* Mức ưu tiên */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Mức độ ưu tiên
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("NORMAL")}
                    className={`rounded-md border py-1.5 text-xs font-medium transition-all ${
                      priority === "NORMAL"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("URGENT")}
                    className={`rounded-md border py-1.5 text-xs font-medium transition-all ${
                      priority === "URGENT"
                        ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Cần gấp
                  </button>
                </div>
              </div>

              {/* Ngày hẹn giao dự kiến */}
              <div className="space-y-1.5">
                <Label htmlFor="expectedDate" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Ngày giao dự kiến
                </Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="text-xs"
                  disabled={isSubmitting}
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-semibold text-foreground">
                  Mục đích / Ghi chú
                </Label>
                <Input
                  id="note"
                  placeholder="VD: Cung ứng phục vụ dự án công trình..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Danh sách vật tư cần mua */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Danh mục vật tư đề xuất ({items.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 px-2.5 text-xs gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Plus className="h-3 w-3" />
                  Thêm dòng
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedMat = materialsList.find(
                    (m) => m.id === item.materialId
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/70 bg-card p-3.5 space-y-3 shadow-2xs hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {selectedMat && (
                            <span className="text-[11px] text-muted-foreground">
                              Hiện tồn:{" "}
                              <strong className="font-mono text-foreground">
                                {selectedMat.currentStock} {selectedMat.unit}
                              </strong>{" "}
                              (Min: {selectedMat.minStock})
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* Chọn vật tư */}
                        <div className="sm:col-span-6 space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Vật tư <span className="text-rose-500">*</span>
                          </Label>
                          <select
                            value={item.materialId}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "materialId", e.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                            disabled={isSubmitting}
                          >
                            {materialsList.map((m) => (
                              <option key={m.id} value={m.id}>
                                [{m.code}] {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Số lượng cần mua */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Số lượng ({selectedMat?.unit || "ĐVT"}) <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            className="h-8 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Mức ưu tiên dòng */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Ưu tiên
                          </Label>
                          <select
                            value={item.priority}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "priority",
                                e.target.value as "NORMAL" | "URGENT"
                              )
                            }
                            className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none"
                            disabled={isSubmitting}
                          >
                            <option value="NORMAL">Bình thường</option>
                            <option value="URGENT">Cần gấp</option>
                          </select>
                        </div>

                        {/* Nhà cung cấp dự kiến */}
                        <div className="sm:col-span-12 space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Nhà cung cấp dự kiến (tùy chọn)
                          </Label>
                          <Input
                            placeholder="VD: Tập đoàn Hòa Phát, Công ty Cổ phần Xi măng Hà Tiên..."
                            value={item.supplier}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "supplier", e.target.value)
                            }
                            className="h-7 text-xs"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              disabled={isSubmitting || items.length === 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang lập phiếu...
                </>
              ) : (
                <>
                  <ClipboardList className="h-3.5 w-3.5" />
                  Lưu & Tạo Phiếu Đề Xuất
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
