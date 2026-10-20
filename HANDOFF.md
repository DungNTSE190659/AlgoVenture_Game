# Handoff: Hoàn thiện màn chơi BFS

## Mục tiêu
- Làm cho màn BFS thực sự chơi được từ đầu đến khi tìm thấy đích.
- Giữ chế độ demo có thể phát, tạm dừng, xem từng bước và chuyển sang chơi.
- Tạo report tiếng Việt hướng dẫn cách chơi và cách chạy demo.

## Phạm vi dự kiến
- Sửa luồng tương tác BFS trong `src/components/GraphGame.tsx`.
- Kiểm tra và sửa snapshot state nếu demo/game bị ảnh hưởng.
- Cải thiện bảng đồ thị và responsive layout khi cần.
- Thêm test cho các tương tác quan trọng và viết report hướng dẫn.

## Vấn đề đã xác định
- Timeline gồm các bước `VISIT`/`FOUND` mà UI không xử lý như thao tác, khiến lượt chơi có thể bị kẹt.
- UI không áp dụng hành động đúng vào queue/visited khi người chơi bấm đỉnh.
- Undo dựng lại timeline từ đầu thay vì quay về bước trước.
- Intro demo clone state bằng JSON nên làm mất `Set` và `Map`.

## Kế hoạch kiểm chứng
- Chạy test BFS liên quan.
- Chạy build TypeScript/Vite.
- Kiểm tra demo và thao tác chơi bằng E2E nếu môi trường hỗ trợ.

## Trạng thái
- Handoff được tạo trước khi triển khai.
- Hoàn tất màn chơi tương tác, hiển thị queue/lớp/trạng thái đỉnh, hỗ trợ bàn phím, hint, undo, reset và đường đi kết quả.
- Sửa snapshot `Set`/`Map` và điều khiển cài đặt/âm thanh của demo.
- Đã viết `BFS_GAME_REPORT.md` hướng dẫn mở demo, cách chơi, luật điểm và nội dung BFS.
- Kiểm chứng đạt: 23 unit tests, 2 BFS Playwright E2E tests và `npm run build`.
