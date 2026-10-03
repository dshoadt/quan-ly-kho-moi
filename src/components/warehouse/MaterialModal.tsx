import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createMaterial, updateMaterial } from "@/server/functions/materials";
import { Package, Plus, Save, Loader2, AlertCircle } from "lucide-react";

export interface MaterialFormData {
  id?: string;
  code: string;
  name: string;
  unit: string;
  location?: string | null;
  minStock: number;
  maxStock: number;
  currentStock?: number;
}

interface MaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: MaterialFormData | null;
  onSuccess?: () => void;
}

const COMMON_UNITS = ["Bao", "Tấn", "Kg", "Thùng", "Viên", "Cây", "Cuộn", "m3", "Mét", "Cái"];

export function MaterialModal({
  open,
  onOpenChange,
  material,
  onSuccess,
}: MaterialModalProps) {
  const isEdit = Boolean(material?.id);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [minStock, setMinStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Điền dữ liệu khi mở modal sửa hoặc reset khi thêm mới
  useEffect(() => {
    if (material) {
      setCode(material.code || "");
      setName(material.name || "");
      setUnit(material.unit || "");
      setLocation(material.location || "");
      setMinStock(material.minStock ?? 0);
      setMaxStock(material.maxStock ?? 0);
      setCurrentStock(material.currentStock ?? 0);
    } else {
      setCode("");
      setName("");
      setUnit("");
      setLocation("");
      setMinStock(0);
      setMaxStock(0);
      setCurrentStock(0);
    }
    setErrorMsg(null);
  }, [material, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate phía client
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanUnit = unit.trim();
    const cleanLocation = location.trim();

    if (!cleanCode) {
      setErrorMsg("Vui lòng nhập mã vật tư (VD: VT-007)");
      return;
    }
    if (!cleanName) {
      setErrorMsg("Vui lòng nhập tên vật tư");
      return;
    }
    if (!cleanUnit) {
      setErrorMsg("Vui lòng nhập đơn vị tính (Bao, Tấn, Thùng, ...)");
      return;
    }
    if (minStock < 0 || maxStock < 0 || currentStock < 0) {
      setErrorMsg("Số lượng và định mức không được âm");
      return;
    }
    if (maxStock > 0 && minStock > maxStock) {
      setErrorMsg("Ngưỡng tối thiểu (Min) không được lớn hơn ngưỡng tối đa (Max)");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && material?.id) {
        const res = await updateMaterial({
          data: {
            id: material.id,
            code: cleanCode,
            name: cleanName,
            unit: cleanUnit,
            location: cleanLocation,
            minStock: Number(minStock),
            maxStock: Number(maxStock),
            currentStock: Number(currentStock),
          },
        });
        toast.success(res.message || "Cập nhật thông tin vật tư thành công!");
      } else {
        const res = await createMaterial({
          data: {
            code: cleanCode,
            name: cleanName,
            unit: cleanUnit,
            location: cleanLocation,
            minStock: Number(minStock),
            maxStock: Number(maxStock),
            currentStock: Number(currentStock),
          },
        });
        toast.success(res.message || "Thêm mới vật tư thành công!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || "Đã xảy ra lỗi, vui lòng thử lại!";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/70 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Package className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEdit ? "Chỉnh Sửa Vật Tư Kho" : "Thêm Vật Tư Mới Vào Kho"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit
              ? "Cập nhật mã định danh, tên gọi, vị trí và hạn mức lưu trữ Min/Max."
              : "Khai báo vật tư mới, thiết lập ngưỡng cảnh báo tồn kho an toàn và số lượng ban đầu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mã vật tư */}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold text-foreground">
                Mã vật tư <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="VD: VT-007, THEP-10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-xs uppercase"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Đơn vị tính */}
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs font-semibold text-foreground">
                Đơn vị tính (ĐVT) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="unit"
                placeholder="VD: Bao, Tấn, Thùng..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Gợi ý ĐVT nhanh */}
          <div className="flex flex-wrap items-center gap-1.5 -mt-1">
            <span className="text-[10px] text-muted-foreground">ĐVT nhanh:</span>
            {COMMON_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  unit === u
                    ? "bg-emerald-600 text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Tên vật tư */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Tên vật tư quy chuẩn <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="VD: Thép xây dựng phi 12 Pomina, Xi măng Nghi Sơn PCB40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              disabled={isSubmitting}
            />
          </div>

          {/* Vị trí lưu kho */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs font-semibold text-foreground">
              Vị trí lưu kho
            </Label>
            <Input
              id="location"
              placeholder="VD: Kho A - Kệ 03, Bãi Ngoài Trời..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs"
              disabled={isSubmitting}
            />
          </div>

          {/* Định mức Min - Max - Tồn kho */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Kiểm soát định mức tồn an toàn
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Min stock */}
              <div className="space-y-1">
                <Label htmlFor="minStock" className="text-[11px] font-medium text-foreground">
                  Ngưỡng Tối Thiểu (Min)
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  step="any"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-muted-foreground">Cảnh báo thiếu hàng</span>
              </div>

              {/* Max stock */}
              <div className="space-y-1">
                <Label htmlFor="maxStock" className="text-[11px] font-medium text-foreground">
                  Ngưỡng Tối Đa (Max)
                </Label>
                <Input
                  id="maxStock"
                  type="number"
                  min="0"
                  step="any"
                  value={maxStock}
                  onChange={(e) => setMaxStock(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-muted-foreground">Cảnh báo thừa tồn</span>
              </div>

              {/* Current stock */}
              <div className="space-y-1">
                <Label htmlFor="currentStock" className="text-[11px] font-medium text-foreground">
                  {isEdit ? "Số Lượng Hiện Tồn" : "Tồn Kho Ban Đầu"}
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  className="h-8 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-muted-foreground">
                  {isEdit ? "Điều chỉnh trực tiếp" : "Tạo phiếu nhập mở đầu"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              disabled={isSubmitting}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : isEdit ? (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Lưu thay đổi
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Thêm vật tư
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
