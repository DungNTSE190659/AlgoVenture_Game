# 03 · Cây — báo cáo triển khai

Ngày 21/10/2026. Checklist đối chiếu: `D:\TaiLieuDoAn\AlgoVenture_GAME_QA_CHECKLIST.md`.

## Cập nhật phản hồi và hai cách xóa BST

- Thử thách xóa nút hai con chấp nhận kéo Buta từ 40 sang 20 để tìm predecessor (30), hoặc sang 60 để tìm successor (50). Hướng dẫn, cây kết quả, kiểm tra hoàn thành và hoàn tác đổi theo lựa chọn; không trừ điểm cho nhánh hợp lệ. Demo chọn cách xóa trong Tùy chọn.
- `src/engine/treeFeedback.ts` giải thích lỗi bằng vật/nút vừa chọn, đích thả, quy tắc bị vi phạm và cách xét tiếp. Áp dụng cả sáu bài: sai hạt/cha/con, nhãn gốc/lá/độ sâu, bốn thứ tự duyệt, ràng buộc BST với tổ tiên, tìm/thêm sai nhánh, chọn sai giá trị thay thế, tháo nhầm bản ở gốc và nối sai cây con.
- Ví dụ: “Bạn đưa Buta tới nút 10. 20 vẫn còn con phải; đi trái không tìm được số lớn nhất. Đang tìm predecessor: đi phải đến khi không còn con phải.” Thay lời nhắc chung “chưa đúng vị trí” bằng dữ kiện của bước hiện tại.
- Nút đang hiển thị đều nhận được thao tác thả để giải thích khi chọn sai đích. Thả ngoài bàn/hủy kéo vẫn không tính lỗi; lỗi được sửa thì lời thoại đổi ngay sang kết quả đúng.
- Unit Tree và phản hồi: **21/21 đạt**. Các ca E2E mới kiểm tra lời báo lỗi ở cả sáu bài, đi tiếp sau lỗi, cả hai phương pháp xóa, hoàn tác đổi phương pháp, Demo và tính điểm. Đã kiểm tra lời lỗi không bị cắt hoặc đè điều khiển ở 1440×900, 390×844, 320×568, 844×390; ảnh `.qa/tree-error-<width>x<height>.png`.
- E2E sau sửa phản hồi: lượt chính **42/42 đạt**, thêm **2/2 ca riêng** xác nhận phép so sánh khi tìm/thêm sai nhánh; file Tree hiện có 44 ca. TypeScript, production build và `git diff --check` đạt. Cảm ứng vẫn là mô phỏng Chrome, chưa kiểm tra điện thoại thật.

## Cập nhật bố cục theo góp ý

- Điểm có biểu tượng sao dùng `GameStats` chung, đặt ngay cạnh Tùy chọn ở cả Demo và Thử thách như Linked List; bỏ điểm lặp dưới chân màn hình.
- Bỏ dòng chủ đề và dòng chặng riêng; gộp tên chặng, trạng thái Demo/Thử thách và đề bài vào khối ngắn. Chuyển phản hồi vào lời thoại Buta để không chiếm chỗ trong cây.
- Bảng cây lấy chiều cao còn lại của viewport; màn thấp/ngang chuyển bố cục phù hợp, không cuộn trang hoặc cắt điều khiển. Kiểm tra thêm kích thước cửa sổ 1251×594 tương ứng ảnh góp ý.
- Kết quả lần chỉnh này: **29/29 E2E Tree đạt**, sau đó **2/2 ca bổ sung đạt** khi kiểm tra mọi bước Demo Duyệt cây/Xóa BST trên màn thấp. **12/12 unit test Tree**, TypeScript và production build đạt. File Tree hiện có **31 ca**; hai ca bổ sung chạy riêng sau lượt 29 ca.
- Đã đo cả `scrollHeight`/`clientHeight` và vị trí bảng/khay/điều khiển để phát hiện nội dung bị cắt; không chỉ ẩn thanh cuộn. Kích thước đã kiểm tra: 1440×900, 1366×768, 1280×600, 1251×594, 390×844, 375×667, 320×568, 768×1024, 844×390.
- Ảnh sau sửa: `.qa/tree-compact-demo-<width>x<height>.png` và `.qa/tree-deep-<width>x<height>.png`.

## Nội dung đã hoàn thành

Vào bản đồ thế giới → **03 · Cây** → **Cây cơ bản**. Vùng Cây mở độc lập để không bị chặn bởi Merge Sort chưa khả dụng; các bài Tree mở lần lượt khi vượt Thử thách trước đó. Tiến độ cũ được giữ theo ID, không tự cấp hoàn thành cho bài Duyệt cây mới.

| Bài | Cách chơi | Các chặng |
| --- | --- | --- |
| Cây cơ bản | Kéo hạt lên cây, kéo nhánh nối cha–con, kéo nhãn vào nút. | Trồng cây 3 nút; nhận biết gốc/lá/cha/độ sâu; trồng cây 7 nút. |
| Duyệt cây | Kéo thẻ giá trị từ nút vào giỏ theo thứ tự; cây gốc giữ nguyên. | Preorder, inorder, postorder, level order. |
| BST | Đổi chỗ hai giá trị sai hoặc trồng hạt vào ô trống. | Quy tắc trái/phải; kiểm tra ràng buộc tổ tiên; tự trồng BST. |
| Tìm kiếm | Kéo Buta từng cạnh, rồi cắm cờ ở kết quả. | Tìm 30; không tìm thấy 35; tìm 50. |
| Thêm nút | Dẫn hạt qua từng điểm so sánh, trồng khi gặp ô rỗng. | Cây rỗng; thêm 25; thêm 55 vào cây nhiều tầng. |
| Xóa nút | Tháo nút về khay, chuyển successor hoặc predecessor và nối lại cây. | Nút lá; nút một con; nút hai con chọn successor (có con phải) hoặc predecessor. |

Cả sáu bài có Demo và Thử thách, tổng cộng 19 chặng. Demo dùng cùng trạng thái và hành động với Thử thách, có vật kéo mô phỏng, phát/tạm dừng, bước trước/sau và tốc độ 1×/1.5×/2×. Demo không cấp hoàn thành.

Mỗi chặng Thử thách cần bấm **Kiểm tra cây** sau khi xong các thao tác; chặng cuối mới lưu hoàn thành bài. Điểm = số thao tác đúng hiện tại × 100 − số lần thả sai × 25, tối thiểu 0. Thả hụt/hủy kéo không trừ điểm. Hoàn tác lùi một bước và thu hồi điểm của bước đó; làm lại chặng giữ số lỗi, chơi lại toàn bài đặt lại điểm/lỗi. Sao: 3 khi không sai, 2 khi sai dưới 4 lần, còn lại 1.

## UI/UX theo checklist

| Tiêu chí | Phần đã triển khai và kiểm chứng |
| --- | --- |
| G01–G05 | Vào từ bản đồ, Demo/Thử thách, hoàn thành, chơi lại, quay về và đi tiếp. Kiểm tra cây theo thuật toán, không ghi lặp khi kích hoạt nhanh. Nút đi tiếp cuối vùng không chuyển sang bài Graph chưa khả dụng. |
| U01, UX07, UX13 | Kiểm tra toàn bộ các chặng ở desktop 1440×900 và mobile 390×844; bàn cây, khay và điều khiển cùng trong tầm nhìn, không tràn ngang. Vùng tương tác tối thiểu 44 px; cây sâu dùng nút 44 px trên mobile và bố trí hai ô con tách nhau. Bố cục cập nhật giữ bảng và điều khiển trong viewport, không cuộn; đã kiểm tra thêm 320×568, 375×667, 768×1024, 844×390 và các cửa sổ desktop thấp. |
| UX01, UX06 | Một yêu cầu ngắn theo từng bước, thả đúng cập nhật ngay; nút Kiểm tra xuất hiện khi hoàn tất chặng. Hướng dẫn chi tiết trong Gợi ý/Tùy chọn. Giữ Nunito, nền thiên nhiên, nút màu kem/xanh và Buta của dự án. |
| UX15, UX18, G03 | Kéo bằng chuột và touch pointer; chọn vật rồi chọn đích bằng chạm, Enter/Space. Đã kiểm tra thả sai, thả hụt, hoàn tác, hủy pointer, ngón thứ hai và touch cancel; không làm mất trạng thái hoặc phạt nhầm. |
| U05 | Hộp thoại native giữ focus, Escape đóng, trả focus về nơi mở và giữ nguyên lượt. |
| GF02, GF06, GF08 | Phân biệt chọn/đúng/sai bằng hình ảnh và lời phản hồi ngay tại bảng; tắt âm vẫn hiểu kết quả. Đích kéo được đánh dấu trung tính, không tô sẵn đáp án. Có giảm chuyển động; hạt/Buta được đặt tránh che giá trị trên nút. |
| GF07 | Đã kiểm tra điều khiển Demo cho đủ sáu bài; tạm dừng đóng băng vật đang di chuyển. Mở Tùy chọn/ẩn tab dừng timer và animation; không tự phát lại khi quay về. |
| A01 | Dùng hệ âm thanh và rung hiện có; bật/tắt âm được lưu. Sửa việc gọi dừng rung trước khi có tương tác người dùng để tránh lỗi console ban đầu. Chưa xác nhận cảm giác nghe/rung trên thiết bị thật. |
| D01, P04 | Hoàn thành còn sau tải lại, dữ liệu localStorage hỏng được phục hồi. TypeScript/Vite build đạt. Luồng chơi sáu bài không phát sinh page error, console error hay tài nguyên nội bộ trả lỗi trong lượt kiểm tra. |

## Bằng chứng kiểm chứng

- Unit: **129/129 đạt**, gồm kiểm tra thuật toán Tree, bất biến BST, cả bốn thứ tự duyệt, ba kiểu xóa, snapshot và luật mở khóa.
- E2E chính: **37/37 đạt** (`tests/tree.spec.ts` với 26 ca tại thời điểm chạy, cộng 11 ca `tests/world-map.spec.ts`).
- E2E bổ sung: **2/2 đạt** cho nút đi tiếp sau Cây cơ bản và Xóa BST. File Tree hiện có tổng cộng 28 ca. Tổng số ca giao diện đã đạt: **39**; hai ca bổ sung chạy riêng sau lượt chính.
- TypeScript và Vite production build: **đạt**. Vite báo cảnh báo kích thước JavaScript chính khoảng 539 kB trước gzip; đây không phải lỗi build.
- `git diff --check`: đạt.

Lệnh kiểm tra lại:

```sh
npm test
npm run build
npx playwright test tests/tree.spec.ts tests/world-map.spec.ts
```

Ảnh kiểm tra lưu trong `.qa/` (thư mục bị Git ignore), gồm `tree-*-mobile.png`, `tree-*-desktop.png`, ảnh kết thúc `*-final.png` và cây sâu `tree-deep-<width>x<height>.png`.

## Giới hạn đã biết

- Touch được phát qua CDP của Chrome ở chế độ mobile/hasTouch; đây là mô phỏng trình duyệt, chưa phải kiểm thử trên Android/iPhone thật hoặc Safari.
- Cảm giác kéo bằng ngón tay, âm thanh/rung thực tế và độ dễ hiểu với người mới cần được đánh giá trực tiếp; không suy ra từ test tự động rằng các trải nghiệm đó đã đạt.
- Các chặng dùng bộ dữ liệu hướng dẫn cố định, chưa có chế độ sinh thử thách ngẫu nhiên vô hạn. Tiến độ hoàn thành lưu cục bộ theo bài; không khôi phục lượt đang chơi sau tải lại.

## Các phần mã chính

- `src/engine/tree.ts`: thuật toán, dữ liệu 19 chặng, snapshot, kiểm tra thả và bố trí cây.
- `src/components/TreeGame.tsx`, `src/tree.css`: giao diện dùng chung cho sáu bài, kéo thả, Demo, hộp thoại, điểm và màn thắng.
- `src/engine/learningTrack.ts`, `src/components/AdventureMap.tsx`, `src/App.tsx`: nốt Duyệt cây, mở khóa và điều hướng.
- `src/engine/tree.test.ts`, `tests/tree.spec.ts`: kiểm chứng thuật toán và luồng tương tác.
