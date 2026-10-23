# Array — Làng ven sông (bản nháp)

Bộ asset chuẩn bị trên nhánh `UI/Asset-array`, chưa áp dụng vào màn chơi hiện tại. Mở `preview.html` để xem hai cảnh minh họa, thử hover/nhấn nút và xem toàn bộ sprite. `preview-overview.png` là bảng xem nhanh; `preview-mobile.png` cho bố cục dọc.

## Thành phần

- `illustrations/island-village.png`: đảo làng gần vuông, nền trong suốt, có nhà, cây, sông, cầu và hàng ô mảng.
- `backgrounds/village-landscape.png`, `village-portrait.png`: nền ngang/dọc có khoảng trống giữa dành cho UI.
- `svg/`, `png/`: sprite gốc SVG và PNG 2x. Không dùng screenshot để cắt UI từ ảnh AI.
- Ô mảng desktop 72×72 và mobile 56×56: thường, chọn, so sánh, đã sắp xếp, đang di chuyển, trống và vô hiệu hóa.
- Nút chính cam đất, nút phụ kem, nút xanh sông, nút gợi ý: thường/hover/nhấn/vô hiệu hóa. Có nút icon, tab, card, bảng chơi, khung thoại và đuôi thoại, trạm bài học, huy hiệu và thanh tiến độ.
- Icon điều khiển Lucide có giấy phép tại `LICENSE-icons.txt`.

## Bảng màu

Cam đất `#D49670` / gờ `#AD7655`; xanh sông `#94C9DA` / gờ `#6C9EAF`; xanh lá `#A4BB83`; kem `#FFF9EB`; chữ `#594A3C`. Cam đất là màu chính, xanh sông dùng cho lựa chọn, vàng nhạt cho so sánh và xanh lá nhạt cho kết quả đúng.

Chữ, số, chỉ số mảng và biểu tượng trạng thái là các lớp riêng khi tích hợp. Không chỉ dùng màu để diễn đạt đúng/sai: ghép icon hoặc nhãn trạng thái lúc triển khai hành vi. Các con số ở preview chỉ minh họa.

## Sử dụng

`unity-assets.json` chứa kích thước thực, kích thước PNG 2x, loại Image và borderPixels (pixel PNG, thứ tự left/bottom/right/top). Sprite `Sliced` dùng 9-slice; sprite `Simple` giữ tỉ lệ. PNG import Single, FullRect, alpha transparency, mipmaps off, Bilinear; đặt RectTransform theo nativeSize. Với progress, clip thanh fill để biểu diễn tỉ lệ. `Empty` là khuôn trống, không phải một ô dữ liệu thực.

Chạy lại từ gốc repo: `node scripts/build-array-ui-assets.mjs`. Script chỉ tái xuất UI, metadata và preview; giữ nguyên ba ảnh minh họa. Các prompt và phương thức tạo ảnh ở `PROMPTS.md`.
