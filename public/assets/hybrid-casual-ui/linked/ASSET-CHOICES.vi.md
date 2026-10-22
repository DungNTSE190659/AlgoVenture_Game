# Chọn asset cho Linked List khi chuyển sang Unity

Bộ bổ sung có **43 biến thể**, mỗi biến thể có SVG và PNG 2x. Các hình được dựng lại theo kích thước đích, giữ độ dày nét và góc bo; không kéo méo hình nguồn. Giao diện web đang được chấp nhận vẫn dùng bộ asset hiện tại. Các biến thể này dành cho bước dựng prefab Unity hoặc thay hình sau này.

## Những phần nên chọn biến thể riêng

| Asset | Kích thước gốc | Lý do và cách dùng |
| --- | --- | --- |
| `node-block-{peach,mint,lavender}-assembly` | 124×64 | Khối trên bàn desktop. Giữ riêng phần mặt, đường chia và gờ dưới. |
| `node-block-…-bank` | 116×56 | Khối ở khay desktop. |
| `node-block-…-mobile` | 94×64 | Khối trên bàn mobile cao. |
| `node-block-…-compact` | 77×44 | Khối trên màn nhỏ, thấp. |
| `node-block-…-bank-mobile` | 58×44 | Khối trong khay mobile: tỉ lệ gần vuông nên cần vẽ riêng để gờ và nét không méo. |
| `slot-frame-desktop` | 148×80 | Khung lắp desktop, nét đứt được vẽ đúng kích thước. |
| `slot-frame-mobile-tall` | 136×96 | Khung mobile cao, có khoảng trống trên/dưới khối. |
| `slot-frame-mobile-medium` | 131×72 | Khung mobile có ít chiều cao hơn. |
| `slot-frame-mobile-compact` | 112×52 | Khung cho màn rất thấp. |
| `btn-neutral-wide` | 264×62 | Nút trung tính dài, dùng cho “Tự mình thử”, hoàn tác/làm lại nếu cần. Có dáng và gờ riêng thay cho việc kéo nút vuông. Vẫn dùng 9-slice khi điều chỉnh kích thước lân cận. |
| `speech-tail-up` | 24×20 | Đuôi thoại chỉ lên Buta ở mobile, đặt riêng cạnh panel thoại. |

Ba màu khối đều có bản thường và `-selected`: **30 hình**. Bốn khung lắp đều có bản thường và `-available`: **8 hình**. Nút dài có thường, `-hover`, `-pressed`, `-disabled`: **4 hình**. Một đuôi thoại: **1 hình**.

Trong Unity, các khối và khung lắp bổ sung dùng **Image Type = Simple**, bật **Preserve Aspect** và chọn profile có tỉ lệ gần kích thước cần dùng. Có thể tăng/giảm đồng đều cả hai chiều. Không kéo khác tỉ lệ vì sẽ lại làm méo góc bo, gờ dưới và nét đứt. Các kích thước này là mẫu thiết kế, không phải quy tắc bắt buộc theo độ phân giải thiết bị.

## Những phần tiếp tục dùng 9-slice hoặc co giãn đồng đều

- Panel bàn, khay, tùy chọn và thân hộp thoại: dùng 9-slice. Đuôi thoại là ảnh con riêng, không nằm trong vùng giãn của panel.
- Nút hành động và nút kiểm tra/gợi ý: dùng sprite riêng cho từng trạng thái, kết hợp 9-slice để chỉnh kích thước.
- Socket tròn, đinh, biểu tượng và Buta: giữ tỉ lệ, tăng/giảm đồng đều. Buta đã có asset ở thư mục `public/assets/buta/2d/`.
- Dây nối: dùng texture lặp trên đường nối tính theo vị trí các khối. Không cần tạo ảnh cho từng độ dài dây.
- Chữ, số và nhãn HEAD/TAIL: đặt bằng TextMeshPro; không đóng cứng vào ảnh khung.

`unity-assets.json` đã có từng file, kích thước PNG, Image Type và border tương ứng. Đây là dữ liệu bàn giao asset; chưa phải prefab hoặc scene đã chạy trong Unity.

## Tái xuất

Chạy `node scripts/build-linked-ui-assets.mjs` tại gốc repo. Lệnh này tự tạo lại biến thể bằng `build-linked-ui-variants.mjs`, xuất PNG, cập nhật manifest và cả hai ảnh tổng hợp. Khi cần thêm tỉ lệ, sửa danh sách profile trong script biến thể.
