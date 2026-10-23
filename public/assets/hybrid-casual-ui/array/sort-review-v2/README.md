# Array Sort — Asset v2 chờ duyệt

Mở preview.html: bảng so sánh màu nút map, 5 cảnh đề xuất, tranh gốc và sprite.

## Thay đổi so với v1

Vẽ mới 5 môi trường bằng imagegen theo background Array: cầu gỗ có vân và dây thừng, khay hành trang đan có góc da, bàn thẻ và vải sage, dòng suối hai nhánh, ngã ba đường làng. Không xuất lại các hình CSS cũ thành ảnh.

Các nút map giữ dáng và icon thuật toán: màu cũ → màu v2

- Bubble #89C4DA → #7AB8CE
- Selection #E9BC6B → #DDB05E
- Insertion #9ABB80 → #8DAD71
- Merge #91BFAD → #83B39F
- Quick #E9A18C → #DD947D

Viền tonal 1.2px, bóng nhẹ 7.5%; không tăng độ dày viền. Cách xử lý tham chiếu Linked List/Tree hiện tại, màu lấy từ làng Array.

Sprite mới: thẻ số giấy treo, thẻ bài có góc in, lá có gân/cuống, 8 đồ hành trang vẽ màu, nút hành động có mép cong nhẹ. Nhân vật vẫn dùng đúng danh tính hiện tại để không đổi ý tưởng game.

## Năm màn

- **Bubble Sort**: Cầu có vân gỗ, dây thừng và hai bờ cỏ. Thẻ số dùng giấy kem treo, thay cho ô vuông phẳng; giữ danh tính từng bạn.
- **Selection Sort**: Khay đan và góc da, các món đồ được vẽ có khối và màu vật liệu. Ô cờ và món đang chọn tách biệt rõ.
- **Insertion Sort**: Bàn gỗ và thảm vải xanh lá. Thẻ giấy có mép kép và góc in; khay đang cầm tách khỏi hàng thẻ. Không đổi quy trình rút–dịch–chèn.
- **Merge Sort**: Hai nhánh nước xanh sông hợp về hồ kết quả. Lá có cuống, gân và tông xanh vàng của tán cây trong background.
- **Quick Sort**: Ba ô cỏ thấp nối bằng đường làng; mốc pivot và hàng chờ có vị trí riêng. Không yêu cầu sắp thứ tự trong từng nhóm.

## File và cách tạo

illustrations/: 5 tranh PNG alpha gốc tạo bằng built-in image_gen; PROMPTS.json lưu prompt và file nguồn.
svg/: sprite UI gốc vẽ bằng mã vector mới; png/: bản PNG 2× xuất Chromium. Chữ/số luôn là lớp riêng. previews/: desktop/mobile từng cảnh và nút map.

Chạy node scripts/build-array-sort-v2.mjs từ gốc repo để tái xuất sprite và preview; giữ nguyên tranh imagegen.

## Ranh giới

Đây là BẢN DUYỆT, không phải UI game đã tích hợp. Không sửa component game, engine, điểm, đáp án, animation hay map đang chạy. Việc tích hợp responsive, tách lớp và hit area theo logic hiện tại sẽ làm sau khi duyệt. Ảnh môi trường là tranh nền, không thay thế các đối tượng tương tác; không dùng các chi tiết trang trí làm hit target.
