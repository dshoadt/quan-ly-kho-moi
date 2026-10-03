import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteMaterial } from "@/server/functions/materials";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface DeleteMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: {
    id: string;
    code: string;
    name: string;
    currentStock: number;
    unit: string;
  } | null;
  onSuccess?: () => void;
}

export function DeleteMaterialDialog({
  open,
  onOpenChange,
  material,
  onSuccess,
}: DeleteMaterialDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!material) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteMaterial({ data: { id: material.id } });
      toast.success(res.message || "Đã xóa vật tư thành công!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa vật tư này!");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/70 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              Xác Nhận Xóa Vật Tư Kho
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Hành động này sẽ xóa vĩnh viễn vật tư khỏi danh mục nếu chưa có giao dịch nào phát sinh.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1.5 text-xs">
          <div className="font-semibold text-foreground">
            {material.name} ({material.code})
          </div>
          <div className="text-muted-foreground">
            Tồn kho hiện tại:{" "}
            <span className="font-mono font-bold text-foreground">
              {material.currentStock} {material.unit}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Lưu ý: Nếu vật tư đã từng được Nhập hoặc Xuất kho, hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn nhật ký chứng từ kho.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Xác nhận xóa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
