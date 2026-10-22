# Stack — kiểm tra triển khai

Ngày: 21/10/2026. Phạm vi: Stack Demo và Bracket Defender, tích hợp trong nhánh Stack & Queue. Queue vẫn là bài chưa triển khai.

## Phạm vi thiết kế

- Bỏ dòng mô tả tiếng Việt trong bảng đáy Stack/Queue; giữ tên và các nút.
- Demo có 22 bước, dùng hình học và ký tự đơn giản. Dạy TOP, PUSH, POP, PEEK, LIFO, underflow/overflow và ghép ngoặc theo đúng đỉnh. Không cấp hoàn thành khi chỉ xem Demo.
- Thử thách giữ core concept trong file đính kèm: một dấu rơi mỗi lần; thao tác trong vùng xanh; ba loại ngoặc từ đầu; FLAG từ cấp 3; ba tim; combo, điểm nhịp chuẩn, kết quả dòng bằng lời; chơi lại/chơi khó hơn; lưu kỷ lục.
- Dùng HUD, Buta, thế giới đồng cỏ và bảng màu pastel hiện có. Dấu ngoặc khác cả hình dạng và màu; không dùng phong cách terminal tối của bản ý tưởng.
- PEEK dùng như gợi ý miễn phí, tạm dừng thời gian và không thay đổi stack. Chưa triển khai hai cột, fog, Slow Mo/Shield/Undo, vật phẩm kiếm từ combo hoặc quảng cáo. Dòng đặc biệt dài 18–20 ký tự ở cấp chia hết cho 5, trước khi có thể được biến đổi thành dòng sai.
- Mỗi cấp có 3 hoặc 4 dòng. Sinh dữ liệu bằng seed; replay giữ nguyên bài. Cấp tăng dần, tốc độ có giới hạn dưới 1.150 ms mỗi dấu. Dung lượng giảm ở cấp cao; dòng đúng luôn có độ sâu vừa dung lượng, tránh bài không thể giải đúng thuật toán.
- FLAG chỉ chấp nhận lỗi tại dấu đang xét hoặc hết dòng còn dấu; không cho đoán lỗi ở một vị trí tương lai. Ngoặc chưa đóng có token kết thúc dòng riêng. Sai thao tác mất một tim và giữ dấu/stack để sửa; bỏ lỡ dấu kết thúc dòng hiện tại và chuyển sang dòng sau nếu còn tim.

## Xác minh

- Unit: 142 bài kiểm tra, 18 file, đều đạt. Trong đó 11 bài Stack kiểm tra parser, lỗi, điểm/combo, bất biến dữ liệu, seed, kỷ lục và timeline. Generator được giải bằng thuật toán chuẩn ở 750 tổ hợp cấp/seed, không mất tim.
- E2E: 31/31 bài kiểm tra đạt (Stack, lộ trình Mảng, HUD và hồi quy Merge). Kiểm tra Demo từng bước và hoàn thành; PUSH/POP đến thắng; FLAG từ cấp 3; thất bại khi hết tim; chơi lại; chặn thao tác lặp; cảm ứng; PEEK không xóa đỉnh; tạm dừng khi mở gợi ý/cài đặt/ẩn tab; lưu tiến trình và kỷ lục; Queue vẫn vô hiệu hóa.
- Layout kiểm tra 1440×900, 1280×580, 390×844, 320×568 và 844×390. Mọi frame Demo vừa chiều cao; thử thách không tạo cuộn ngang/dọc ở các kích thước này; các nút hành động ít nhất 44×44 px.
- So sánh HUD với các màn Sort ở cùng 5 kích thước: tiêu đề, nút, điểm, footer và gợi ý dùng cùng kiểu/vị trí. Đã xem ảnh desktop, điện thoại nhỏ và màn ngang để kiểm tra ngoài số đo DOM.
- Đồng hồ chuyển động trả tiến độ 0 ngay khi đổi dấu/kiện, không để khung hình mới dùng tiến độ cũ trước khi effect reset. Có kiểm tra chặn thao tác sớm và hồi quy Merge.
- Có reduced motion, trạng thái focus/nút disabled, hướng dẫn vào màn, kết quả thắng/thua và đường quay về bản đồ. Không có dịch vụ mạng, tài khoản hoặc quảng cáo mới.

## Giới hạn kiểm tra

Tự động hóa chạy trên Chrome desktop với viewport và cảm ứng mô phỏng. Chưa đo FPS, pin, âm thanh/haptics trên thiết bị Android/iOS thật. Không xem việc kiểm tra trong trình duyệt là chứng nhận phát hành mobile.

## Tệp chính

- `src/engine/stack.ts`: luật, parser, sinh dòng, record.
- `src/engine/stackConfig.ts`: thông số cấp độ, điểm và chữ giao diện.
- `src/engine/stackLesson.ts`: timeline và lời Demo.
- `src/components/StackGame.tsx`, `src/stack.css`: màn chơi và bố cục.
- `src/engine/stack.test.ts`, `tests/stack.spec.ts`: kiểm tra riêng Stack.

## Đối chiếu checklist mobile

Tham khảo [Checklist for mobile game trên Viblo](https://viblo.asia/p/checklist-for-mobile-game-bJzKmMqwK9N). Các mục được áp dụng trong phạm vi web game:

| Nhóm | Kết quả/phạm vi |
| --- | --- |
| Giao diện, hướng màn hình, menu, chữ, thanh cuộn | Kiểm tra 5 viewport và mọi bước Demo; so sánh HUD với các màn đã có. |
| Gameplay, tutorial, điểm, thao tác lặp, hết giờ | Có kiểm tra tự động parser, tính điểm, hoàn thành/thua, replay, FLAG và nhấn liên tiếp. |
| Cài đặt, lưu dữ liệu, đa nhiệm | Kiểm tra kỷ lục, tiến trình, tạm dừng khi mở cài đặt/gợi ý và ẩn tab. |
| Âm thanh, rung, hiệu năng, pin | Dùng hệ thống âm/rung sẵn có; chưa xác minh trên điện thoại thật hoặc thử chạy nhiều giờ. |
| Thanh toán, chat, tài khoản, multiplayer, cửa hàng ứng dụng | Không thuộc màn chơi web cục bộ này. |


## Điều chỉnh theo phản hồi giao diện

- Khung thoại Demo rộng tối đa 1.400 px; phần lời rộng tối đa 1.100 px, có chiều cao tối thiểu và mở rộng theo nội dung. Chữ giữ cùng cỡ đọc với Demo cũ; mobile dùng 16–17 px.
- Cột Stack Demo rộng 240 px ở desktop và 168–190 px trên điện thoại; ký tự 29–42 px. Chiều cao co theo vùng còn lại để giữ nút điều khiển và lời Buta trong màn hình.
- Bỏ toàn bộ thẻ mã của Demo, mã giả, lời gọi hàm và biểu thức isValid ở thử thách. Màn chuyển dòng giữ dãy ngoặc và lời kết quả.
- Thử thách tự bắt đầu ở lần vào màn, chơi lại và đổi cấp. Hướng dẫn thao tác/FLAG nằm trong phần phản hồi của sân chơi, không mở cửa sổ Vào ca.

Xác minh sau điều chỉnh: 13/13 E2E (Stack và HUD) đạt; build production thành công. Đã xem ảnh Demo có phần tử trên desktop, điện thoại nhỏ và màn ngang. Không có thẻ mã, cửa sổ Vào ca hay cuộn bổ sung trong các viewport đã kiểm tra.


## Thông báo chuyển dòng

Bỏ bảng kết quả phủ sân chơi và nút Sang dòng tiếp theo. Thay bằng một dòng trạng thái trong vùng phản hồi sẵn có: dấu kiểm và chữ xanh khi hợp lệ/phát hiện lỗi đúng, biểu tượng cảnh báo và chữ cam khi bỏ lỡ, nêu mất một tim. Không thêm nền mờ hay thay đổi vị trí các nút. Chữ nổi nhẹ, giữ ngắn rồi mờ đi trong 1,5 giây và tự chuyển dòng. Giảm chuyển động giữ chữ tĩnh đến khi chuyển; gợi ý/cài đặt/ẩn tab vẫn tạm dừng thời gian và hiệu ứng. Hộp kết quả cuối cả lượt chơi được giữ lại.

Kiểm tra thay đổi thông báo: 4/4 E2E đạt (lượt chơi đúng, FLAG/dòng sai, hết tim, thông báo tự biến mất và tạm dừng); build thành công. Đã xem ảnh desktop và điện thoại 320 px.


## Buta theo mẫu Search và bổ sung âm thanh

Thay khung thoại giãn rộng/cao cố định bằng cùng cấu trúc `lesson-narrator`, `lesson-pig-stage`, `lesson-narration` của Search. Bong bóng có đuôi thoại, tự co theo chữ; Buta dùng kích thước Search ở desktop (174 px thông thường), 86–96 px trên điện thoại. Kiểm tra so sánh trực tiếp với Linear Search về kích thước Buta, nền, padding, bo góc; xác nhận lời ngắn làm bong bóng thu lại. Kiểm tra mọi frame Demo và ảnh 5 viewport để tránh cuộn.

Thêm 5 âm tổng hợp riêng: PUSH trượt xuống/chạm đáy; POP bật lên; PEEK hai nốt nhẹ; lỗi hai nốt trầm; hoàn thành dòng ba nốt sáng. Demo phát đúng âm khi đổi bước, cả bằng tay và phát tự động. Thử thách dùng cùng âm và rung theo thao tác. Âm vẫn theo thiết lập chung; tạm dừng/cài đặt/ẩn tab hủy âm đang phát, không phát lại bước cũ khi mở tiếng. Không dùng tệp âm tải ngoài hoặc nhạc nền mới.

Xác minh ngày 22/10: 12 bài E2E Stack đã đạt sau cập nhật. Đã kiểm tra 5 waveform bằng OfflineAudioContext (có năng lượng âm, khác nhau), ghi nhận âm thực sự phát cho thao tác Demo/thử thách, tắt tiếng và tạm dừng. Build production thành công. Chưa kiểm tra loa/rung trên điện thoại thật.
