# Merge Sort — Suối Hợp Nhất

## Mở bản thử

Chạy `npm run dev`, vào Mảng → Sort → Merge Sort. Hoàn thành Bubble, Selection và Insertion để mở bài theo tiến trình hiện có. Chọn Xem demo hoặc Thử thách.

## Cách chơi

1. Chia nhóm lá thành hai nửa liên tiếp bằng cách kéo giọt nước Tách nhánh sang bờ trái/phải, hoặc bấm/chạm/Enter trên nút. Sơ đồ nhỏ phía trên cho phép chọn nhóm cần chia. Mỗi lá còn một nhóm mới chuyển sang ghép.
2. So sánh hai lá đầu nhánh. Kéo lá nhỏ hơn xuống hồ, hoặc chạm/Enter/Space trên lá để chọn. Các lá phía sau chờ lượt.
3. Bằng nhau phải lấy nhánh trái trước. Bông hoa, màu và số danh tính nhỏ trên lá giúp theo dõi tính ổn định.
4. Khi một nhánh hết, người chơi vẫn tự đưa từng lá còn lại xuống hồ. Không có đồng hồ hay tự chạy.
5. Ghép đủ nhóm thì bấm Ghép nhánh tiếp theo. Bấm Hoàn tất dòng suối ở nhóm cuối để ghi hoàn thành và mở Quick Sort.

Chia đúng cộng 50 điểm, ghép một lá đúng cộng 100 điểm. Chọn sai trừ 25 điểm, giữ nguyên các lá để sửa. Thả hụt/hủy kéo không trừ điểm. Sao dựa trên số lần thử sai. Thử thách không highlight lá cần chọn ở mọi mức, kể cả khi mở gợi ý. Demo vẫn minh họa lựa chọn. Khó có số âm và số trùng; mọi mức không giới hạn thời gian. Có nhập mảng 2–8 số nguyên trong khoảng −99…99.

Demo dùng cùng bàn lá sen và engine Merge Sort: có phát/tạm dừng, tiến/lùi, tốc độ 1x/1.5x/2x, mảng riêng và chuyển sang Thử thách. Demo không cấp hoàn thành. Tạm dừng dừng cả chuyển động lá; mở cài đặt/ẩn tab chặn thao tác và dừng âm thanh/rung.

## Kiến trúc và kiểm chứng

- `src/engine/mergeSort.ts`: cây chia nhóm, ghép ổn định và timeline Demo.
- `src/engine/mergeStream.ts`: chia thủ công, chọn nhóm, chọn lá, điểm, lỗi và tiếp tục nhóm.
- `src/components/MergeGame.tsx`: màn chơi, Demo, cài đặt và ghi hoàn thành.
- `src/components/MergeStreamBoard.tsx`: sơ đồ nhánh, lá SVG, kéo thả, bàn phím/cảm ứng, hồ và chuyển động.
- `src/merge.css`: phong cách thiên nhiên, bố cục màn dọc/ngang và reduced motion. Không tải asset nhà máy.

Lệnh kiểm tra:

```sh
npm test
npm run build
```

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
npx playwright test tests/merge.spec.ts tests/game-hud.spec.ts
```

Unit test kiểm tra chia không đổi thứ tự, chọn nhánh tùy ý, từ chối lá sai/lá không ở đầu, ưu tiên trái khi bằng nhau, input âm/trùng/lẻ/đảo ngược, bảo toàn danh tính và bất biến snapshot. Engine băng chuyền cũ cùng nguồn asset được giữ lại nhưng không còn được import bởi màn Merge Sort.

E2E kiểm tra chơi tới cuối, lưu hoàn thành/mở Quick, không tiến triển khi chờ lâu, sửa sai, chuột/cảm ứng/bàn phím, thả hụt/hủy, cài đặt/gợi ý/ẩn tab, mảng riêng, mức Khó, điều khiển Demo, tạm dừng chuyển động lá và tốc độ. Bố cục được kiểm tra ở 1440×900, 1280×580, 390×844, 320×568, 844×390; duyệt toàn bộ frame Demo trên năm kích thước.

Ảnh kiểm tra nằm trong thư mục Git-ignore `.qa/`: `merge-stream-split-{width}.png`, `merge-stream-merge-{width}.png`, `merge-stream-demo-{width}.png`, `merge-stream-preview.png`.

Kiểm tra cảm ứng dùng mô phỏng Chromium/Edge. Cảm giác kéo trên thiết bị thật vẫn nên được đánh giá khi playtest.
