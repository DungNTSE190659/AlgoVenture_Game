# Queue — Demo và Quầy nước của Buta

Ngày kiểm tra: 22/10/2026.

## Thiết kế

Trò phục vụ đồ uống dạy FIFO bằng tình huống xếp hàng quen thuộc. Mỗi khách có mã số và đơn hàng. Chỉ khách đầu hàng được phục vụ; người mới luôn nối cuối, tối đa 4 chỗ. Người chơi chọn một trong ba loại nước và chủ động Đón khách. Không thể đổi thứ tự tùy ý. Khi sai, khách/đơn vẫn giữ nguyên để sửa.

Dễ/Vừa/Khó cần phục vụ 6/8/10 khách; tốc độ khách đến và thời gian chờ tăng độ thử thách. Khách mất kiên nhẫn ở đầu hàng hoặc bị bỏ lỡ bên ngoài mất một tim rồi rời đi. Phải phục vụ đủ số khách để thắng, không thể thắng chỉ bằng chờ hết giờ. Ba tim, thưởng chuỗi, kỷ lục, chơi lại và đổi cấp. Không có cửa sổ vào màn hoặc bảng chuyển dòng che sân chơi.

Demo 17 bước minh họa số, không dùng đồ họa quầy hoặc mã lệnh. FRONT chỉ xem đầu hàng, ENQUEUE nối cuối, DEQUEUE lấy đầu. Ví dụ bounded Queue minh họa underflow/overflow và từ chối thao tác lỗi. Buta và bong bóng thoại dùng kiểu Search, co theo chữ. Có bước trước/sau, tốc độ, phát/tạm dừng, âm theo thao tác và reduced motion.

## Xác minh

- 151 unit test, 19 file đều đạt. 9 test Queue bao gồm bất biến dữ liệu, FIFO, thời gian chờ, sinh khách không trùng ID, mất tim, đủ điều kiện thắng, cả ba cấp đều giải được, record và timeline.
- E2E Queue: Demo, thắng cả ba cấp, lưu tiến trình và kỷ lục, thất bại không cấp hoàn thành, chơi lại, gợi ý/cài đặt/tab ẩn tạm dừng, cảm ứng và âm thanh/tắt tiếng.
- Kiểm tra mọi frame Demo và bàn chơi ở 1440×900, 1280×580, 390×844, 320×568, 844×390. Đối chiếu ảnh ngoài các số đo DOM; sửa quầy trên điện thoại ngang để tránh che tiêu đề/footer. Nút chính tối thiểu 44 px.
- Mở Queue từ bản đồ và kiểm tra HUD chung cùng các màn Sort/Stack. Các bài Stack và Queue mở độc lập; tổng bài của Mảng giữ là 9.

## Phạm vi checklist mobile

Theo nhóm kiểm tra trong [checklist đã dùng](https://viblo.asia/p/checklist-for-mobile-game-bJzKmMqwK9N): bố cục/hướng màn hình, tutorial, thao tác đúng/sai, điểm, chơi hết màn, lưu dữ liệu, cài đặt và đa nhiệm được kiểm tra trong Chrome. Không thêm tài khoản, multiplayer, quảng cáo hay thanh toán. Chưa đo FPS/pin hoặc thử loa/haptics trên Android/iOS thật.

## Tệp

- `src/engine/queue.ts`: luật, cấu hình độ khó, record và timeline.
- `src/components/QueueGame.tsx`: Demo, sân chơi, khách/ly SVG và HUD.
- `src/queue.css`: bố cục và chuyển động.
- `src/engine/queue.test.ts`, `tests/queue.spec.ts`: kiểm tra riêng Queue.

Kết quả cuối: 17/17 E2E (Queue, lộ trình Mảng và HUD) đạt; build production thành công. Đã xem lại ảnh desktop, điện thoại 320 px và màn ngang sau sửa bố cục.
