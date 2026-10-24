# Linked List: học qua tương tác

Construction mở bằng bốn tương tác ngắn: nhận biết dữ liệu/next, đọc liên kết từ HEAD, nối lại đường đi và kết thúc ở NULL. Không cần xem demo trước; demo vẫn mở được từ bản đồ.

Sau đó người chơi tự xây danh sách hai nút, rồi tăng lên ba và bốn nút. Chỉ đánh dấu hoàn thành Construction sau màn bốn nút. Trong màn làm bài chỉ giữ các thao tác phục vụ bài học và nút Cáo gợi ý; bỏ Hoàn tác, Làm lại và Khám phá lại. Chơi lại vẫn có ở hộp thoại kết quả.

Thử thách chỉ nêu mục tiêu. Cáo giải thích theo lỗi (thiếu nút, sai thứ tự, thiếu/sai liên kết, vòng lặp, thiếu NULL hoặc bắt đầu duyệt sai chỗ). Hướng dẫn từng bước nằm sau nút “Cáo gợi ý”. Thao tác thử sai không trừ điểm hay sao. Trong thử thách, sau 5 lần bấm Kiểm tra mà chưa đúng sẽ hiện hộp thoại thua và cho chơi lại; phần làm quen vẫn cho thử thoải mái. Hộp thoại thắng/thua dùng cáo, màu nền, viền và nút theo Bubble Sort; thống kê số lần kiểm tra, lỗi, lượt đặt/nối và số nút đã duyệt.

Traversal, Search, Insertion và Deletion bắt đầu với danh sách đã nối, để người chơi tập trung vào kiến thức của bài thay vì lắp lại. Các demo vẫn thể hiện đầy đủ quá trình xây dựng và thao tác.

Giao diện chung dùng đúng nền #9191FF của map và Bubble Sort, bộ nút vàng và hộp thoại từ assets/bubble-ui. Trên desktop, danh sách nằm ngang bên trái; cáo, hộp thoại và các nút thao tác ở cột bên phải. Phần làm quen và cả sáu demo dùng cùng bố cục; màn nhỏ xếp vùng chơi phía trên vùng hội thoại và thao tác. Khối nổi có phần dữ liệu/next. Bỏ nền tuyết, khung bảng và khung hội thoại lớn trong màn Linked List. Không thay giao diện map và Bubble Sort đã duyệt.

Kiểm tra tự động mới: `tests/linked-casual.spec.ts`. Các kiểm tra Linked List cũ dùng điều hướng `.topic-dots`/`.atlas-enter` thuộc bản đồ trước đây; cần dùng điều hướng CurriculumMap hiện tại khi cập nhật chúng.

Đã được cho phép chạy test trở lại. Nút Tiếp tục dùng xanh lá; bỏ nút Xem demo trong phần làm quen, bổ sung TAIL và chỉ hiện liên kết sau khi xác nhận đúng. Liên kết bên ngoài chưa chọn hiển thị dấu ?; ô trong khối luôn ghi next.

NULL giữ mặt vàng và bóng đổ khi rê chuột, đồng nhất giữa phần làm quen và thử thách.

Demo trên màn nhỏ dùng lưới cố định theo chiều cao viewport, khay nằm ngang và các khối co theo bề rộng. Không cuộn ngang/dọc; lời cáo và điều khiển có vùng riêng. `tests/linked-demo-fit.spec.ts` kiểm tra từng frame của cả sáu demo tại 320×568, 390×844, 844×390.

Mỗi nút dùng một vùng bấm thống nhất. Trong Construction sau khi đặt đủ nút, chạm khối nguồn để chọn next rồi chạm khối đích để nối; kéo vẫn cho phép đổi chỗ. Nhãn next nằm trong phần tử con giới hạn theo mặt khối, chữ next luôn cố định trong khối trên desktop và mobile, trước/sau khi nối. Khay mobile bám sát hàng lắp, chữ trong ô trống tự xuống dòng thay vì tràn ra ngoài.

Cụm `.linked-playfield` nhóm khay và hàng lắp, căn giữa vùng chơi mobile; cáo và điều khiển nằm ở hai hàng cuối. Hàng nút giãn theo bề rộng khả dụng. Asset `public/assets/hybrid-casual-ui/linked/svg/node-casual.svg` có vạch đen đậm ở ranh giới data/next; cả hai vùng vẫn thuộc cùng một nút bấm.
