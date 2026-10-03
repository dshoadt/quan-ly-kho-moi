# 🟡 Giai đoạn 3: Kiểm soát Tồn kho & Cảnh báo

**Thời gian ước tính:** 2-3 ngày
**Tương ứng BPMN:** Khối 2 (Kiểm tra ngưỡng) + Khối 3 (Kiểm soát định mức)

## Công việc chi tiết
| # | Task | Mô tả |
|---|------|-------|
| 3.1 | Cấu hình ngưỡng min/max | Cho phép set ngưỡng tối thiểu/tối đa mỗi vật tư |
| 3.2 | Engine kiểm tra ngưỡng | Logic: `tồn < min` → thiếu, `tồn > max` → thừa |
| 3.3 | Trang Inventory Dashboard | Hiển thị toàn bộ tồn kho, highlight bất thường |
| 3.4 | Hệ thống cảnh báo | Badge, notification khi có vật tư vượt ngưỡng |
| 3.5 | Server Functions inventory | `getInventoryStatus`, `getAlerts` |
| 3.6 | Biểu đồ tồn kho | Recharts hiển thị phân bố tồn kho |

## Logic kiểm tra ngưỡng
```
Với mỗi Vật tư:
├── currentStock < minStock → 🔴 THIẾU → Trigger đề xuất mua hàng
├── currentStock > maxStock → 🟡 THỪA → Cảnh báo + Đưa vào báo cáo
└── minStock ≤ currentStock ≤ maxStock → 🟢 BÌNH THƯỜNG
```

## Output giai đoạn 3
- ✅ Thiết lập ngưỡng min/max cho vật tư
- ✅ Dashboard tồn kho với trạng thái trực quan
- ✅ Hệ thống cảnh báo (thiếu/thừa)
- ✅ Biểu đồ tồn kho
