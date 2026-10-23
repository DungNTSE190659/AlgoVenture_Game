# Array Sort — Bộ asset chờ duyệt v1

Mở preview.html để xem đủ năm cảnh; previews/ có ảnh desktop và mobile của từng cảnh.

## Phạm vi

Chủ đề Array và map đã dùng đảo, nền Array tạo ngày 22/10/2026. Bộ sort-review-v1 này CHƯA được gắn vào bất kỳ màn chơi thật nào. Không sửa engine, tính điểm, kiểm tra đáp án, hit area, animation, thao tác kéo/chạm/phím hay quy trình demo.

## Phân tích năm màn

### Bubble Sort

Nguồn: src/components/BubbleRunBoard.tsx.

Kéo để đổi chỗ khi trái lớn hơn phải; giữ nguyên nếu đã đúng. Phần cuối đã vào trại sẽ được bỏ qua ở lượt sau.

Đề xuất: Bạn trên cầu giữ nguyên danh tính qua mỗi lần đổi. Chỉ cặp hiện tại có dấu ngoặc; phần đã xong có dấu ✓ và nhãn Trại.

### Selection Sort

Nguồn: src/components/SelectionPackBoard.tsx.

Chọn món nhỏ nhất trong phần chưa xếp, rồi đưa về ô cờ. Nếu món ở ô cờ đã nhỏ nhất, giữ nguyên vị trí.

Đề xuất: Ô cờ là đích đến, khác với món đang chọn. Giữ hình món đồ, số, danh tính và thứ tự vị trí; không biến thành thao tác kéo tự do.

### Insertion Sort

Nguồn: src/components/InsertionCardTable.tsx.

Rút thẻ đang xét; dịch các thẻ lớn hơn sang ô trống; chèn vào đúng chỗ. Số bằng nhau giữ thứ tự.

Đề xuất: Khay đang cầm, ô trống thật và vùng đã xếp tách biệt. Số và ký hiệu thẻ được vẽ riêng, không nằm trong sprite.

### Merge Sort

Nguồn: src/components/MergeStreamBoard.tsx.

Chia nhóm theo thứ tự lá. Khi ghép, lấy lá đầu nhỏ hơn ở hai nhánh; bằng nhau lấy nhánh trái trước.

Đề xuất: Hai nhánh chảy về vùng kết quả. Chỉ lá đầu là lựa chọn hợp lệ; dấu A/B vẫn đi theo lá để thể hiện tính ổn định.

### Quick Sort

Nguồn: src/components/QuickForestGame.tsx.

Chọn một số làm pivot; đưa các số còn lại vào nhóm nhỏ hơn, bằng hoặc lớn hơn. Kiểm tra rồi chọn nhánh mở tiếp theo.

Đề xuất: Cột mốc tách khỏi ba nhóm, nhãn < = > luôn đi với giá trị mốc. Không gợi ý phải sắp thứ tự bên trong nhóm.

## Thiết kế

Kem, xanh lá/xanh sông nhạt, vàng cát và đất nung nhạt. Viền 1 px, bóng thấp; không glow, không viền dày. Có normal, selected, compare, sorted, moving, wrong, disabled. Dùng thêm nhãn/ký hiệu, không chỉ màu. Preview là bố cục minh họa, không thay đổi hoặc chạy lại luật chơi.

Bạn trên cầu và Quick giữ đúng species/scarf theo item.id hiện tại, xuất từ FriendArt đang dùng rồi làm nhẹ nét. Selection giữ loại vật dụng hiện tại; bộ icon là Lucide. Merge giữ hình lá. Insertion giữ thẻ và ô trống, không chuyển thành ô mảng thông thường.

## File

- svg/: sprite nền trong suốt, số và chữ là lớp riêng.
- png/: bản raster 2×, alpha transparency.
- previews/: 5 cảnh × desktop/mobile, cộng bảng trạng thái.
- manifest.json: kích thước native, vai trò, trạng thái và slice inset nếu có.

Các panel/button dùng nine-slice theo inset trong manifest khi tích hợp, tránh kéo méo góc. Trong preview HTML chỉ minh họa bằng background-size. Sprite nhân vật/lá/ô/thẻ giữ tỷ lệ, kích thước hit target và hành vi lấy từ component gốc. Các icon và màu nhận diện không thay đổi ID dữ liệu.

## Tái tạo

Chạy node scripts/build-array-sort-review.mjs từ gốc repo. Dùng SVG gốc trong repo, React server rendering, Lucide, TypeScript transpiler và Chromium để xuất PNG. Không dùng ảnh AI cho bộ UI vector này; tranh đảo/nền là các file đã có, không ghi đè chúng.

Chờ duyệt hình ảnh trước khi tích hợp sprite vào năm game.
