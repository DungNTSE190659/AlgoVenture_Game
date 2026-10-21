# Kế hoạch phần Cây (Tree) cho AlgoVenture

## 1. Mục tiêu và hiện trạng

Người chơi đi từ việc nhận biết cấu trúc cây đến tự thao tác trên cây tìm kiếm nhị phân (BST). Mỗi nốt có **Demo** để quan sát từng bước và **Thử thách** để thực hành, giống các vùng hiện có.

Trước khi triển khai, `learningTrack.ts` khai báo 5 nốt `tree-basics`, `bst`, `bst-search`, `bst-insert`, `bst-delete`, cùng vùng **Rừng Cây Tri Thức**, chưa có màn chơi. Bản triển khai ngày 21/10/2026 đã thêm nốt Duyệt cây và nội dung cho cả sáu nốt; xem `TREE_GAME_REPORT.md` để biết kết quả kiểm chứng. Bản đồ giữ mô hình nốt, đường đi, Buta và hai nút Demo/Thử thách.

## 2. Lộ trình nội dung đề xuất

| Thứ tự | Nốt trên bản đồ | Kiến thức và thao tác chính | Điều kiện hoàn thành Thử thách |
| --- | --- | --- | --- |
| 1 | **Cây cơ bản — Mầm Cây Đầu Tiên** | Gốc, nút, cạnh, cha/con, lá, độ sâu; phân biệt trái/phải trong cây nhị phân. | Kéo các hạt/nút từ khay lên vị trí gốc, con trái, con phải để hoàn thiện cây nhỏ. |
| 2 | **Duyệt cây — Lối Mòn Qua Tán Lá** *(nốt mới)* | DFS theo **preorder** (gốc–trái–phải), **inorder** (trái–gốc–phải), **postorder** (trái–phải–gốc); **level order** (từng tầng) được giới thiệu ở mức trực quan. | Kéo lần lượt thẻ giá trị từ các nút vào dải thứ tự duyệt; các bài nhỏ mở bốn cách duyệt. |
| 3 | **BST — Cây Cửa Ngõ** | Quy tắc `trái < gốc < phải`, so sánh ở từng nút; dùng giá trị nguyên không trùng trong toàn bộ phần Tree. | Kéo nút đặt sai sang nhánh phù hợp để sửa cây và xác nhận bất biến BST. |
| 4 | **Tìm kiếm BST — Theo Nhánh Tìm Số** | So sánh với nút hiện tại rồi chọn trái/phải; nhận biết trường hợp tìm thấy và không có giá trị. | Kéo Buta qua từng nhánh đến mục tiêu hoặc nhánh rỗng khi không tìm thấy. |
| 5 | **Thêm nút BST — Ươm Một Nhánh Mới** | Lặp lại phép so sánh đến vị trí rỗng rồi thêm nút, giữ bất biến BST. | Dẫn hạt giống qua các nhánh rồi thả vào đúng ô con còn trống. |
| 6 | **Xóa nút BST — Chăm Sóc Tán Cây** | Ba tình huống: nút lá, một con, hai con; trường hợp hai con chọn **successor** (nhỏ nhất bên phải) hoặc **predecessor** (lớn nhất bên trái). | Kéo nút cần xóa ra khỏi cây, nối lại nhánh; khi có hai con, chọn nhánh tìm successor hoặc predecessor rồi kéo giá trị đó vào vị trí thay thế. |

**Ưu tiên phát hành:** Hoàn thiện 1–5 trước; xóa nút là chặng cuối vì có nhiều trạng thái và cần hướng dẫn kỹ hơn. Level order nằm trong nốt Duyệt cây để tránh thêm một nốt ngắn; BFS ở vùng Đồ thị vẫn có bài riêng. AVL, heap, cây đỏ đen và cân bằng cây để dành cho phần mở rộng, sau khi sáu nốt này được kiểm chứng với người chơi.

## 3. Trải nghiệm và giao diện

### Nhận diện hình ảnh

- Giữ font **Nunito**, nền thiên nhiên sáng, thẻ màu kem, bo góc lớn, đường viền/đổ bóng nổi nhẹ, xanh lá của vùng Cây và linh vật Buta. Dùng màu nốt sẵn có trong `TREES`; thêm màu xanh lá riêng cho nốt Duyệt cây.
- Bảng cây là một khoảng rừng gọn: nút như hạt/cụm lá, các cạnh rõ ràng như nhánh, **giá trị số ở giữa nút**. Gốc có nhãn “Gốc”; nhánh trái/phải dùng biểu tượng/mũi tên và chữ, không dựa vào màu đơn thuần.
- Trạng thái có hình thức nhất quán: **đang xét** viền sáng và nhịp nhẹ; **đã duyệt** dấu tích; **chọn sai** rung rất ngắn kèm lời gợi ý; **đường đi đúng** làm sáng dần từng cạnh. Âm thanh và rung dùng hệ thống hiện tại, tuân theo tùy chọn của người chơi.

### Khung màn hình

1. **Đầu trang:** về bản đồ, tên nốt, tùy chọn âm thanh/nhịp học theo `GameHeader`.
2. **Dòng nhiệm vụ:** một câu ngắn, có mục tiêu cụ thể (ví dụ “Tìm 42. 42 nhỏ hay lớn hơn 50?”), không lặp nguyên văn lý thuyết.
3. **Bảng cây:** vùng rộng nhất; nút, Buta và hạt giống là vật có thể kéo; ô con, nhánh và khay kết quả là vùng thả có viền sáng khi kéo tới gần. Các cạnh vẽ phía sau. Bảng cây dùng phần chiều cao còn lại của viewport; bố trí đủ các nút và vùng thả trong màn hình, không cuộn trang hay cuộn bảng.
4. **Dải giải thích:** Buta và lời thoại ngắn; trong Demo có điều khiển phát/tạm dừng/bước trước/bước sau và tiến trình. Trong Thử thách có **Buta gợi ý**, hoàn tác và đặt lại khi phù hợp.
5. **Cuối màn:** phản hồi tại chỗ sau thao tác; hoàn thành thì dùng màn thắng hiện có, nút chơi lại và trở về bản đồ.

### Tương tác theo bài — ưu tiên cảm giác chơi

- **Cây cơ bản:** người chơi kéo các hạt/nút từ khay lên cây để trồng gốc và các nhánh. Kéo một nhánh từ nút cha tới ô con để thể hiện quan hệ; nút mới nảy lá khi đặt đúng. Bài nhận biết cho kéo nhãn “Gốc”, “Lá”, “Cha” vào đúng vị trí thay vì chỉ trả lời câu hỏi.
- **Duyệt cây:** người chơi kéo thẻ giá trị từ cây vào các ô trống của dải kết quả. Thẻ vừa thả hiện số thứ tự; đường Buta đã đi sáng lên để thấy preorder/inorder/postorder/level order khác nhau thế nào. Thả sai thì thẻ bật về vị trí cũ và gợi ý quy tắc duyệt hiện tại. Có hoàn tác một bước.
- **BST:** cây mẫu có một hạt đặt sai nhánh; người chơi nhấc và chuyển nó vào ô hợp lệ. Ô thả được đánh dấu trung tính khi đang kéo; phản hồi đúng/sai sau khi thả xét ràng buộc của **cả nhánh**, không chỉ nút cha, để không tiết lộ trước đáp án. Một bài khác cho kéo các giá trị từ khay lên cây trống theo đúng quy tắc BST.
- **Tìm kiếm BST:** kéo Buta từ nút hiện tại theo cạnh trái/phải; khi thả, Buta chạy dọc nhánh và phép so sánh hiện ngay trên đường (`42 < 50`). Khi gặp giá trị cần tìm, kéo lá cờ đích lên nút; khi không có, kéo cờ lên ô nhánh rỗng. Không cho kéo Buta nhảy qua nhiều tầng.
- **Thêm nút BST:** kéo hạt giống từ khay qua từng nút để khám phá đường đi, rồi thả vào ô con trống phù hợp. Mỗi điểm dừng có phản hồi so sánh; thả ở nhánh sai thì hạt quay về điểm dừng gần nhất, giữ nguyên phần đã làm đúng.
- **Xóa nút BST:** kéo nút cần xóa về khay. Với một con, kéo nhánh còn lại nối vào cha; với hai con, kéo Buta sang phải để tìm successor hoặc sang trái để tìm predecessor, kéo giá trị thay thế vào gốc rồi tháo nút cũ và nối lại con còn lại nếu có. Chia thành từng pha có chỉ dẫn và nút **Kiểm tra cây** ở cuối, để người chơi thực sự sửa cấu trúc.

**Quy tắc kéo thả chung:** vật được nhấc lên có bóng/độ phóng nhẹ, vùng thả hợp lệ hiện rõ, thả đúng thì hút vào vị trí và phát phản hồi ngắn; thả ngoài vùng thì trở về vị trí cũ. Demo diễn lại chính các thao tác kéo thả của bài chơi, có thể tạm dừng và xem từng bước. Nút bấm chỉ dành cho điều khiển như gợi ý, hoàn tác, đặt lại, tiếp tục.

### Dễ dùng và phù hợp màn hình

- Vật kéo và vùng thả có diện tích chạm tối thiểu khoảng **44 × 44 px**, ưu tiên vùng thả lớn hơn hình vẽ; hiển thị nhãn rõ ở 320 px. Vật đang kéo nổi trên nội dung khác và không bị thanh điều khiển che.
- **Mobile dọc 390×844:** khay vật kéo, cây, vùng thả và hành động chính cùng nằm trong tầm nhìn; giảm khoảng trống trước khi thu nhỏ cây. Bố trí cây 7–9 nút cùng khay và điều khiển trong viewport; không có thao tác cuộn để tiếp cận đích. **Desktop 1440×900:** dùng chiều rộng để đặt cây bên cạnh lời thoại/khay, giữ cây đủ lớn và không trải các nút quá xa nhau. Ở màn nhỏ hoặc ngang thấp, thu gọn thông tin phụ và đổi sang bố cục hai cột khi phù hợp; vẫn giữ toàn bộ bàn chơi và điều khiển trong màn hình.
- Kéo thả hoạt động bằng chuột và cảm ứng; các ô thả đều ở trong bảng, không cần tự cuộn theo tay kéo. Để hỗ trợ bàn phím và người khó kéo chính xác, có thao tác **chọn vật → chọn nơi đặt** với cùng luật chơi; focus rõ, thông báo kết quả qua `aria-live`. Dùng `prefers-reduced-motion` để bỏ chuyển động không cần thiết.
- Theo dõi một `pointerId` cho mỗi lượt kéo; ngón thứ hai, `pointercancel`, mất focus hoặc ẩn tab phải hủy an toàn và trả vật về trạng thái trước khi kéo. Không tính lỗi/điểm trừ cho thao tác bị hủy hoặc thả hụt. Sau khi đóng Tùy chọn/Gợi ý, focus quay lại nơi mở và bàn chơi giữ nguyên.
- Không phạt ngay khi chạm nhầm trong Demo. Ở Thử thách, phản hồi nói **vì sao** sai và gợi ý bước kế tiếp; tránh bắt người chơi làm lại từ đầu khi còn có thể hoàn tác.

## 4. Thiết kế bài học và độ khó

- **Demo:** 1 cây mẫu cố định mỗi nốt, khoảng 5–7 nút; có phát/tạm dừng, bước trước/sau, chỉnh tốc độ và chuyển thẳng sang Thử thách. Một bước chỉ dạy một quyết định. Tạm dừng, mở Tùy chọn hoặc ẩn tab phải dừng cả bộ đếm bước lẫn chuyển động đang chạy; Demo không cấp hoàn thành.
- **Thử thách:** 3 mức/bài nhỏ: làm quen (3–5 nút, gợi ý nổi bật), luyện tập (5–7 nút), vận dụng (7–9 nút, có tình huống không tìm thấy, thêm sâu hoặc xóa hai con). Cây sinh ra phải hợp lệ và có kết quả xác định.
- **Quy ước BST:** giá trị nguyên **không trùng**, con trái nhỏ hơn, con phải lớn hơn; xóa hai con chấp nhận cả successor và predecessor theo inorder, tự hướng dẫn theo nhánh người chơi chọn; Demo chọn cách trong Tùy chọn. Ghi quy ước này trên màn BST để người chơi không phải đoán.
- **Mở khóa:** hoàn thành Thử thách của nốt trước để mở nốt sau; Demo luôn xem được khi nốt đã mở. Tiến độ lưu theo `TrackId` hiện có.

## 5. Triển khai theo giai đoạn

1. **Nền tảng:** thêm nốt `tree-traversal` vào `TREES`; cập nhật mô tả vùng, icon và số nốt. Sửa điều kiện mở vùng Cây: hiện tại vùng này phụ thuộc hoàn thành toàn bộ Mảng và Danh sách, trong khi Merge Sort chưa khả dụng; chọn quy tắc mở khóa có thể đạt được trước khi bật Tree.
2. **Engine chung:** kiểu `TreeNode`, sinh cây mẫu/bài tập, bố trí nút theo tầng, kiểm tra BST, tạo timeline bất biến cho Demo và hành động có thể hoàn tác. Tách logic khỏi React để dùng chung ở Demo và Thử thách.
3. **Bảng cây dùng chung:** cạnh SVG + nút HTML, hệ kéo thả bằng Pointer Events dùng chung cho chuột/cảm ứng, vùng thả, snap và hoàn tác; cùng một hành động có cách chọn vật → chọn nơi đặt qua bàn phím. Thích nghi điện thoại và màn thấp. Dùng `GameHeader`, `GameFooter`, Buta, âm thanh và màn thắng hiện có.
4. **Ra nội dung:** Cơ bản → Duyệt → BST → Tìm kiếm → Thêm → Xóa. Mỗi nốt được nối vào `App.tsx` và `lessonAvailable` khi cả Demo và Thử thách đã hoàn chỉnh; tránh cho người chơi đi vào màn fallback của thuật toán khác.
5. **Kiểm chứng:** áp dụng checklist tại `D:\TaiLieuDoAn\AlgoVenture_GAME_QA_CHECKLIST.md` cho từng nốt Tree. Kiểm tra cây rỗng/1 nút, nhánh sâu, không tìm thấy, thêm trái/phải, xóa lá/một con/hai con; chơi trọn lộ trình và kiểm tra lưu tiến độ. Hai kích thước nghiệm thu chính là **390×844** và **1440×900**; kiểm tra thêm 320×568, 768×1024 và màn ngang thấp khi bố cục liên quan. Chạy unit test khi đổi logic, E2E khi đổi luồng chơi, xem lại màn khi đổi CSS và build trước bàn giao.

## 6. Đối chiếu checklist UI/UX và nghiệm thu

Checklist nguồn: `D:\TaiLieuDoAn\AlgoVenture_GAME_QA_CHECKLIST.md`. Các dòng dưới đây là **yêu cầu cần kiểm chứng khi triển khai**, chưa phải kết quả đã đạt.

| Mã checklist | Yêu cầu áp dụng cho Tree | Cách xác nhận |
| --- | --- | --- |
| **G01–G05** | Từ bản đồ vào Demo và Thử thách, thắng/chơi lại/quay về; thuật toán và hình ảnh đúng; thao tác sai/hủy kéo phục hồi; điểm/sao chỉ cộng một lần; Demo không mở khóa. | Chơi trọn luồng từng nốt, unit test engine và E2E các đường chính/đường lỗi. |
| **U01, UX07, UX13** | Mobile 390×844 và desktop 1440×900 không cắt chữ, chồng nút, tràn ngang; khay–cây–đích–nút chính ở trong tầm nhìn; vùng chạm/thả khoảng 44×44 CSS px. | Chụp/đo hai viewport ở Demo, đang kéo, đang chơi và màn thắng; thử thêm màn nhỏ/ngang khi có ảnh hưởng. |
| **UX01, UX06** | Mỗi pha chỉ có một hành động chính nổi bật, hướng dẫn ngắn và cụ thể; gợi ý mở thêm giải thích, không tiết lộ sẵn đáp án. | Xem lần lượt các pha Cơ bản, Duyệt, Tìm, Thêm, Xóa ở cả hai viewport. |
| **UX15, UX18, G03** | Kéo bám con trỏ/ngón tay; đích thả dễ thấy; chọn vật → chọn đích và bàn phím có cùng luật; hủy kéo, thả hụt, ngón thứ hai không làm dính hoặc phạt. | Thử chuột, chế độ cảm ứng, bàn phím; thử `pointercancel`, mất focus và ẩn tab. |
| **U05** | Gợi ý/Tùy chọn mở đóng dễ, không mất lượt; focus trở lại đúng vị trí. | Mở/đóng giữa một lượt kéo và giữa Demo; kiểm tra state/focus. |
| **GF02, GF06, GF08** | Phản hồi đúng/sai/hoàn thành phân biệt và nằm gần thao tác; chuyển động ngắn, không nhấp nháy hoặc tự cuộn bất ngờ; giảm chuyển động vẫn đọc được trạng thái, tắt âm vẫn hiểu kết quả. | Thao tác liên tiếp, thử bật `prefers-reduced-motion` và tắt âm. |
| **GF07** | Demo có bước trước/sau, tốc độ, tạm dừng; mở Tùy chọn hoặc ẩn tab dừng cả timeline và animation. | Kiểm tra điều khiển ở giữa chuyển động kéo thả mô phỏng. |
| **A01** | Âm không tự phát khi tải, không chồng dồn; bật/tắt và lưu lựa chọn. | Tải mới, thao tác nhanh, tắt/bật và tải lại. |
| **D01, P04** | Tiến độ/cài đặt còn sau tải lại; dữ liệu lưu lỗi không gây crash; build và luồng Tree không có lỗi console hay asset thiếu. | Tải lại với dữ liệu hợp lệ/lỗi, chạy build và kiểm tra console/network. |

Chỉ đánh dấu một mã **đạt** sau khi có bằng chứng từ lần kiểm tra tương ứng. Báo cáo bàn giao nêu ngắn phần đã kiểm tra và giới hạn còn ảnh hưởng việc demo; không suy từ test tự động rằng cảm giác kéo thả trên thiết bị thật đã được xác nhận.

## 7. Tiêu chí chấp nhận

- Sáu nốt Tree có Demo và Thử thách chạy từ bản đồ đến màn hoàn thành, không rơi vào màn của thuật toán Mảng.
- Mỗi thao tác làm thay đổi cây/đường đi rõ ràng, đúng quy tắc đã dạy; lời thoại Buta giải thích được quyết định hiện tại.
- Không có nút bị che, cạnh bị cắt khó hiểu hay thanh điều khiển đè lên cây ở các cỡ màn mục tiêu.
- Mỗi bài có ít nhất một thao tác kéo thả trực tiếp lên cây; người chơi hoàn thành được bằng chuột, cảm ứng hoặc bàn phím. Kéo sai không làm mất bước đúng trước đó; hoàn tác/đặt lại, tiến độ, âm thanh và chế độ giảm chuyển động hoạt động đúng.
