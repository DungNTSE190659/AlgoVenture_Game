# Báo cáo và hướng dẫn chơi BFS

## Mục tiêu

Màn BFS giúp người chơi hiểu cách Breadth-First Search (tìm kiếm theo chiều rộng) khám phá đồ thị và tìm đường đi ngắn nhất trên đồ thị không trọng số.

## Cách mở demo và màn chơi

1. Chạy ứng dụng bằng `npm run dev` rồi mở URL Vite hiển thị trong terminal (mặc định `http://127.0.0.1:5173`).
2. Trên bản đồ chủ đề, chọn **Đồ thị** → **Vào vùng đất**.
3. Trên lộ trình, chọn **BFS**.
4. Chọn **Xem demo** để xem hướng dẫn hoặc **Thử thách** để tự chơi.

## Điều khiển

### Demo

- **Bắt đầu / Tiếp tục** phát hoặc tiếp tục demo tự động.
- **Tạm dừng** dừng demo tại khung hiện tại.
- **Bước tiếp / Bước trước** xem từng hành động thủ công.
- Khi demo kết thúc, chọn **Tự mình thử** để vào màn chơi.
- Mở **Tùy chọn** để đổi độ khó hoặc bật/tắt âm thanh.

### Thử thách

- Nhìn vào hàng đợi (QUEUE); phần tử đầu hàng đợi được đánh dấu.
- Khi được yêu cầu lấy đỉnh ra, chọn đúng đỉnh ở đầu hàng đợi trên đồ thị.
- Khi được yêu cầu thêm neighbor, chọn đỉnh kề chưa thăm được chỉ định. Đỉnh được đánh dấu visited khi đưa vào queue để tránh lặp qua chu trình.
- Khi đích đến lượt, chọn đỉnh đích để kết thúc và xem đường đi tìm được.
- **Buta gợi ý** chỉ ra thao tác cần làm và trừ 50 điểm.
- **Hoàn tác** quay lại trước thao tác đúng gần nhất; **Chơi lại** khởi động lại màn.
- Thao tác đúng cộng 100 điểm; chọn sai bị trừ 50 điểm.

Các đỉnh có thể được chọn bằng chuột, chạm hoặc bàn phím khi focus. Màu sắc và số lớp trên đỉnh hỗ trợ theo dõi trạng thái; đường đi cuối cùng được tô nổi bật.

## Nội dung BFS trong màn chơi

BFS dùng queue FIFO để khám phá lần lượt các đỉnh theo từng lớp khoảng cách:

1. Đưa đỉnh bắt đầu vào queue và đánh dấu đã thăm.
2. Lấy đỉnh đầu queue ra.
3. Đưa từng neighbor chưa thăm vào cuối queue, đánh dấu đã thăm ngay khi enqueue.
4. Lặp lại đến khi đến đích.

Với đồ thị không trọng số, cách khám phá theo lớp bảo đảm đường đầu tiên đến đích có số cạnh ít nhất. Đồ thị có chu trình cũng được xử lý nhờ tập visited.

| Độ khó | Đỉnh | Điểm bắt đầu → đích | Đường ngắn nhất |
|---|---:|---|---|
| Hướng dẫn | 5 | A → E | A → C → E |
| Có cycle | 6 | A → F | A → C → D → E → F |
| Phức tạp | 8 | A → H | A → B → D → H |

## Kiểm chứng

- Unit tests: `npm test -- src/engine/graph.test.ts src/engine/graphLesson.test.ts`
- E2E: `npx playwright test tests/graph-game.spec.ts`
- Build: `npm run build`

Các E2E kiểm tra demo có thể tua từng bước và chuyển sang thử thách; gameplay kiểm tra chọn sai, queue, gợi ý, hoàn tác và kết quả đường đi ngắn nhất.
