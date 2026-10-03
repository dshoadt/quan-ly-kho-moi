# 🟠 Giai đoạn 4: Đề xuất Mua hàng

**Thời gian ước tính:** 3-4 ngày
**Tương ứng BPMN:** Khối 4 - Kế hoạch & Đề xuất Mua hàng

## Công việc chi tiết
| # | Task | Mô tả |
|---|------|-------|
| 4.1 | Tự động phát hiện vật tư thiếu | Scan vật tư có `tồn < min` |
| 4.2 | Tính toán số lượng cần mua | `SL cần mua = maxStock - currentStock` |
| 4.3 | Tạo phiếu đề xuất | Form tạo phiếu với danh mục vật tư |
| 4.4 | Chỉnh sửa phiếu | Thêm/xóa vật tư, chỉnh số lượng |
| 4.5 | Server Functions procurement | `createProcurement`, `updateProcurement`, `getProcurements` |
| 4.6 | Trạng thái phiếu | DRAFT → SUBMITTED → APPROVED |
| 4.7 | Tính ngày giao dự kiến | `Ngày đặt + 30 ngày` (có thể cấu hình) |

## Cấu trúc Phiếu Đề xuất
```
┌─────────────────────────────────────────────┐
│          PHIẾU ĐỀ XUẤT MUA HÀNG            │
│  Mã phiếu: PO-2026-001                     │
│  Ngày tạo: 02/10/2026                       │
│  Ngày giao dự kiến: 01/11/2026              │
├─────┬──────────┬─────┬────┬────────┬────────┤
│ Mã  │ Tên VT   │ ĐVT │ SL │ NCC    │ T.Thái │
├─────┼──────────┼─────┼────┼────────┼────────┤
│ VT01│ Ống thép │ Cây │ 50 │ ABC Co │ Cần gấp│
│ VT02│ Bu lông  │ Con │200 │ XYZ Ltd│ B.thường│
└─────┴──────────┴─────┴────┴────────┴────────┘
│  [✏️ Chỉnh sửa]  [🖨️ In phiếu]  [💾 Lưu]  │
└─────────────────────────────────────────────┘
```

## Output giai đoạn 4
- ✅ Phát hiện tự động vật tư cần mua
- ✅ Tạo và quản lý phiếu đề xuất
- ✅ Thêm/xóa/sửa vật tư trong phiếu
- ✅ Workflow trạng thái phiếu
- ✅ Tính ngày giao dự kiến
