# Hướng dẫn UI game sắp xếp cho agent

Reference đang dùng: `src/components/BubbleGame.tsx`, `src/bubbleStudio.css`, `src/components/QuickForestGame.tsx`, `src/quickStudio.css`. Đọc component cùng các CSS override cuối cùng trong `src/main.tsx`; không sao chép giao diện xanh lá cũ.

## Phong cách

- Nền tím phẳng `#9191ff`; vàng chính `#ffdb3b`; chữ tím đậm `#37284c` (số trên thẻ `#2c2037`).
- Hội thoại nền lavender nhạt `#f0ebff`, viền đậm, bóng cứng nhỏ. Mảng tổng quan có thể dùng kem `#fff8e6`, trạng thái hoàn thành vàng, tránh thêm nhiều màu khác.
- Font **Nunito**, kế thừa từ `src/styles.css`, hỗ trợ tiếng Việt. Nội dung 700–800; nút 800–900; số và tiêu đề 900–1000. Desktop: tiêu đề 28–32px, số 32–44px, hội thoại 17–19px. Mobile: hội thoại 14–16px, số 22–30px; co bố cục trước khi giảm cỡ chữ.
- Dùng lại `public/assets/bubble-ui/tile.svg`, `tile-active.svg`, `button.svg` và asset hội thoại hiện có. Nút dùng border-image 12px với button.svg. Không tạo asset mới nếu asset hiện tại đáp ứng được.
- Nhân vật Cáo: `src/components/Fox.tsx`, ảnh trong `public/assets/fox/`. Mood thinking/oops cho hướng dẫn hoặc lỗi, celebrate khi xong.
- Không thêm các card nền vàng/tím lớn bọc mọi khu vực. Bảng chơi thoáng, phân khu bằng khoảng cách và đường kẻ mảnh.

## Bố cục và thông tin

- Màn hình vừa viewport `100dvh`, không scroll ngang/dọc. Header: quay về trái, tên thuật toán giữa, cài đặt phải.
- Desktop: bảng chơi lớn bên trái, Cáo + hội thoại + điều khiển bên phải; giới hạn nội dung khoảng 1400–1440px, khoảng cách 24–40px. Không thu toàn bộ game thành một cụm nhỏ giữa màn hình.
- Mobile dọc: header, tiến độ/bảng chơi, hội thoại và điều khiển theo chiều dọc. Mobile ngang: hai cột, Cáo nhỏ hơn. Dùng min-width/min-height:0, safe area và media query theo cả chiều cao.
- Chỉ giữ tên thuật toán, điểm (gameplay), tiến độ có nghĩa, số đang thao tác, nhãn nhóm cần cho thuật toán và thao tác chính. Có mảng tổng quan khi nó giúp theo dõi kết quả; số phải đủ lớn và có tương phản rõ.
- Hướng dẫn và phản hồi tập trung trong hội thoại Cáo. Không lặp thêm “Xem cách chơi”, “Kéo thẻ vào…”, “Hàng chờ N bạn”, dãy số bé phụ dưới thẻ, mô tả kỹ thuật hoặc nhãn trang trí không giúp ra quyết định.
- Demo: bước trước / phát hoặc tạm dừng / bước tiếp, tiến trình và tốc độ, nút tự chơi khi xong. Không yêu cầu tương tác gameplay trong demo.
- Cài đặt: âm thanh, rung, mức độ, mảng tùy chỉnh có validation, chơi lại. Đóng modal trả focus; mở modal/ẩn tab dừng âm thanh và chuyển động.

## Gameplay tự do và phản hồi

- Tham khảo luồng thao tác của Bubble Sort: để người chơi chọn/thử, kiểm tra tại hành động; không vô hiệu hóa tất cả lựa chọn sai hoặc tô sẵn đáp án.
- Với Merge Sort: được chọn nhóm để tách; giữ hai nửa liên tiếp. Khi ghép, mọi thẻ nguồn đều có thể bấm/kéo. Lấy thẻ phía sau trước, chọn đầu nhánh lớn hơn, hoặc lấy bên phải khi bằng nhau đều là sai.
- Sai: trừ 25 điểm (sàn 0), tăng số lỗi, đánh dấu thẻ vừa sai, Cáo nói lý do cụ thể. Giữ trạng thái hợp lệ để thử lại, không tự sửa hay tự chơi thay. Đúng: chuyển đúng một thẻ, cộng điểm và xóa lỗi cũ.
- Không giới hạn thời gian. Hỗ trợ chuột, chạm và bàn phím; kéo ra ngoài/hủy kéo không làm mất thẻ hoặc trừ điểm.
- Không hiệu ứng hover hay âm thanh khi chỉ rê chuột. Giữ focus-visible và phản hồi nhấn. Dùng audio/feedback chung, không tăng gain riêng từng game. Tôn trọng reduced-motion.
- Giữ định danh phần tử để giải thích tính ổn định khi số bằng nhau; có thể dùng ký tự A/B nhỏ trên thẻ nếu cần, không biến nó thành dòng chữ phụ gây rối.

## Kiểm tra trước khi bàn giao

Chạy build, unit test luật thuật toán, kiểm tra thao tác sai và sửa lại, số trùng/số âm, hoàn tất và lưu tiến độ. Kiểm tra mọi bước demo và trạng thái đông thẻ ở 1440×900, 390×844, 320×568, 844×390. Không che hội thoại hoặc điều khiển, không có scroll. Không làm mất thay đổi sẵn có trong repo.

## Demo Merge Sort

Dùng `MergeDemoBoard.tsx` riêng. Không dùng lại bảng tương tác `MergeStreamBoard`, cây nhỏ ghi số lượng thẻ, nút tách/chọn nhánh hoặc thống kê gameplay. Bước chia hiển thị giá trị thật của nhóm trước và sau, ngăn nhóm bằng khoảng cách/đường kẻ. Bước ghép chỉ có hai nhóm đang xét, thẻ được chọn, và hàng kết quả bên dưới; giữ chỗ thẻ đã chuyển để tránh nhảy bố cục. Cáo giải thích; chỉ các nút playback/cài đặt là tương tác. Không nhân đôi toàn bộ giao diện gameplay trong demo.

### Lời thoại Cáo trong demo

Mỗi frame phải có lời thoại đúng với snapshot đang hiển thị. Khi chia, nêu các giá trị trước/sau; khi so sánh, nêu hai số đầu và lý do chọn bên trái/phải; khi đặt, dùng thì đã hoàn thành, nêu số vừa xuống và vị trí; khi hết một bên, nói rõ bên nào và các số còn lại. Với số bằng nhau, giải thích lấy trái trước. Không nhắc người xem kéo/bấm thẻ trong demo. Giọng thân thiện với “mình”, “nhìn này”, “nhé”, tránh lặp câu khuôn mẫu hoặc khen sau mọi thao tác. Không thêm hai frame tổng kết cùng một trạng thái nếu không có ý mới. Đổi biểu cảm theo hành động. Kiểm tra thoại dài với mảng 8 số trên mobile, kể cả khi tua ngược.

## Challenge Merge Sort tự do

Challenge dùng `MergeChallenge.tsx` và engine `mergeChallenge.ts`, tách khỏi demo. Người chơi chọn nhóm và chọn ranh giới chia; chọn hai nhóm để ghép; chọn/kéo thẻ vào ô kết quả. Không tự chọn nhóm tiếp theo, không tự điền thẻ. Có thể xử lý nhánh phải trước nhánh trái, hoặc ghép nhánh đã sẵn sàng trong khi nhánh khác còn chưa chia. Chỉ ghép hai nhóm con cùng cha và đều đã xử lý xong. Khi số phần tử lẻ, quy ước chia nửa trái ít hơn một thẻ như demo. Điền kết quả từ trái sang phải; chỉ lấy thẻ đầu và ưu tiên nhỏ hơn, bằng nhau lấy trái trước. Sai trừ 25 điểm (sàn 0), giữ trạng thái hợp lệ và giải thích. Không giới hạn số lần thử, không thua sau 5 lỗi. Hoàn tất một nhóm sẽ trả về bảng để người chơi tự chọn thao tác tiếp. Không thưởng điểm khi chỉ chọn nhóm hoặc bắt đầu ghép, tránh lặp thao tác để lấy điểm.

### Ô kết quả và lời Cáo trong challenge

Ô trống dùng nền lavender nhạt `#EDE7FF`, viền liền 2px `#65508A`, bóng nhẹ; bên trong không có số/chữ. Khi nhận thẻ, thay bằng nguyên thẻ vàng, bỏ nền/viền/bóng của ô trống. Bình thường Cáo chỉ nêu yêu cầu ngắn theo giai đoạn (chia mảng, chọn nhóm ghép, điền kết quả); không đọc đáp án hoặc giảng quy tắc trước. Chỉ sau thao tác sai mới giải thích lỗi cụ thể bằng vị trí/số lượng/giá trị vừa chọn và cách sửa. Khi có thao tác đúng tiếp theo, trở lại yêu cầu ngắn. Quy tắc này dành cho challenge; demo vẫn giải thích từng bước.

## Selection Sort

`SelectionGame.tsx`, `SelectionPackBoard.tsx`, `selectionStudio.css` dùng thẻ vàng và Cáo, không dùng theme hành trang/thảm/đồ vật cũ. Lá cờ đánh dấu đầu phần chưa xếp; dấu tích đánh dấu phần đã cố định. Desktop một hàng, mobile tối đa bốn cột đọc từ trái sang phải, rồi xuống hàng.

Demo: chỉ có mảng, cờ, đánh dấu số nhỏ nhất tạm thời và số đang so sánh, hội thoại theo từng frame và playback. Không hiện điểm/nút gameplay. Challenge: chọn thẻ chỉ là chuẩn bị, chưa chấm điểm; có thể bỏ chọn miễn phí hoặc kéo bất kỳ thẻ vào bất kỳ ô nào để thử. Chấm lúc thực hiện: số chọn phải nhỏ nhất trong phần chưa xếp, đích phải là ô cờ. Sai trừ 25, giữ nguyên mảng, Cáo giải thích. Không khóa các thẻ đã cố định để che các thao tác sai; thử dùng chúng sẽ bị báo lỗi khi thực hiện. Đúng cộng điểm một lần cho cả lượt, gồm cả trường hợp giữ nguyên vị trí. Chấp nhận mọi thẻ có cùng giá trị nhỏ nhất; Selection Sort đổi chỗ không đảm bảo ổn định. Kéo hụt/hủy kéo không tính là một lượt sai và không cộng điểm.

## Màu hoàn thành thống nhất

Thẻ đã hoàn thành dùng `assets/bubble-ui/tile-settled.svg` màu xanh lá như Bubble Sort. Selection đổi xanh các vị trí đã cố định. Quick đổi xanh các số đã đúng vị trí trong mảng tổng quan. Merge đổi xanh cả mảng khi ghép xong nhóm gốc, không đổi các nhóm đơn tạm thời sang xanh toàn bộ khiến người chơi tưởng đã hoàn tất. Insertion đổi xanh các thẻ khi hoàn tất thuật toán. Áp dụng cho demo và gameplay, quay lại màu bình thường khi chơi lại hoặc tua về trước.
