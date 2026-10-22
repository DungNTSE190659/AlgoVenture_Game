# Asset giao diện chọn chủ đề

47 asset UI, mỗi asset có SVG và PNG 2x. Đã áp dụng vào màn chọn chủ đề: nền, panel thông tin, nút vào/tiếp tục, nút điều hướng, nút âm thanh, la bàn, huy hiệu chủ đề, dấu trang và chấm chuyển trang.

- `desktop`: panel 540×152, nút 492×46.
- `mobile`: panel 362×152, nút 328×46.
- `compact`: panel 292×144, nút 258×42.
- `landscape`: panel 320×144, nút 286×42.
- Các panel có thông báo cao thêm 22 px. Nút có đủ thường, hover, nhấn, vô hiệu hóa.
- `unity-assets.json`: đường dẫn, kích thước native/PNG, profile và Image Type.
- `preview-desktop.png`, `preview-mobile.png`: bảng xem asset.

CSS chỉ chọn file theo màn hình/trạng thái, bố trí các phần tử, đặt chữ/số và xử lý tương tác. Chủ đề Danh sách đã dùng ảnh đảo được duyệt ở `islands/linked-list.png`; chủ đề Cây dùng `islands/trees.png`, cùng phong cách đồ chơi nổi. Mảng và Đồ thị tiếp tục dùng hình hiện có.

## Đảo Linked List đã được duyệt

Buta đứng ở góc dưới trái khi nghỉ tại đảo Danh sách, dùng tư thế pointing có sẵn để chỉ về đảo. Đường đi khi chuyển chủ đề vẫn được tính bằng logic chuyển động hiện có.

`concepts/linked-island-concept.png` là bản phác đảo Linked List, tạo bằng **built-in image_gen.imagegen**, nền trong suốt, 1536×1024. Bản được duyệt đã được sao chép sang `islands/linked-list.png`, ghi vào mục `illustrations` của manifest và áp dụng cho chủ đề Danh sách. Bản gốc vẫn được giữ trong thư mục concept. Prompt gốc nằm trong `concepts/PROMPT.md`.

## Dùng trong Unity

Import PNG thành Sprite / Single / Full Rect, bật alpha transparency, tắt mipmaps. PNG là 2x; đặt RectTransform theo `nativeSize` và chọn đúng profile. Dùng Sprite Swap cho trạng thái nút, TextMeshPro cho chữ/số. Biểu tượng giữ tỉ lệ. Panel/nút đã có các tỉ lệ thiết kế riêng; nếu đổi bố cục mạnh thì thêm profile thay vì kéo méo ảnh. Đây là bộ asset bàn giao, chưa phải scene/prefab được chạy trong Unity.

Tái xuất từ gốc repo bằng `node scripts/build-atlas-ui-assets.mjs`. Lệnh không tạo lại ảnh đảo; chỉ đăng ký bản đảo đã được duyệt vào manifest. Các icon điều khiển dựa trên Lucide, giấy phép nằm ở `LICENSE-icons.txt`.

Các nút Vào/Tiếp tục dùng xanh ngọc tươi: normal `#35C990`, hover `#4DDDA3`, pressed `#23B77D`, gờ dưới `#159563`. Mỗi trạng thái là file SVG/PNG riêng.
