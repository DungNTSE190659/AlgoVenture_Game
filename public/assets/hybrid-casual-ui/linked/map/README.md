# Asset bản đồ chọn bài Linked List

Màu nút hành động và Reversal dùng xanh ngọc `#35C990`, gờ `#159563`, hover `#4DDDA3`, pressed `#23B77D`. Trạm, huy hiệu số và tên bài dùng bảng màu tươi dưới đây; tên bài dùng màu gờ đậm để đọc rõ trên nền kem. Trạng thái khóa vẫn dùng màu dịu để phân biệt.

| Bài | Mặt trạm | Gờ / chữ |
| --- | --- | --- |
| Construction | Vàng mật ong `#F7B83D` | `#A96712` |
| Traversal | Ngọc lam `#27C9BE` | `#117C79` |
| Search | Xanh trời `#39B8F2` | `#176B9C` |
| Insertion | Cam đào `#FF9658` | `#AD4E25` |
| Deletion | Tím kẹo `#B777ED` | `#7540A5` |
| Reversal | Xanh ngọc `#35C990` | `#159563` |

Bộ này được áp dụng trực tiếp cho màn “Danh sách”, gồm 6 trạm bài học và bảng chọn Demo/Thử thách. SVG là nguồn vector, PNG 2x dùng được với Unity UGUI. Các hình được dựng theo kích thước thiết kế, không chụp từ giao diện web.

## Desktop và mobile

- `station-linked-…-desktop-{normal,selected,locked}`: trạm 82×84.
- `station-linked-…-mobile-{normal,selected,locked}`: trạm 76×80, dựng lại hình và góc bo.
- `island-{desktop,mobile}`: bệ trạm, lần lượt 140×88 và 132×88.
- `caption-{desktop,mobile}`: bảng tên; cùng kích thước thiết kế 150×60, được xuất riêng theo profile để tiện thay đổi sau này.
- `sheet-{desktop,mobile}`: panel chọn bài 540×164 và 362×164.
- `sheet-status-{desktop,mobile}`: panel cao 190 khi có thông báo.
- `number-linked-…-{desktop,mobile}`: huy hiệu số theo màu bài; số là text riêng.
- `button-{demo,challenge}-{desktop,mobile}-{normal,hover,pressed,disabled}`: hình nút theo profile và trạng thái, không dùng bộ lọc màu CSS.
- `road-{up-left,up-right}-{desktop,mobile}-{open,locked}`: đoạn đường cong giữa hai trạm. Native width 570 desktop, 390 mobile; chiều cao mỗi đoạn 220.

Các icon, huy hiệu số/trạng thái, nút header, thanh tiến độ và hoa trang trí dùng chung vì chỉ cần đổi kích thước đồng đều. Ảnh nền ngang/dọc và Buta tiếp tục dùng các file đã có ở `../backgrounds/` và `public/assets/buta/2d/`.

Sáu icon bài học `icon-linked-*.svg/png` là hình minh họa đồ chơi có màu, khối nổi và viền đậm, dựng riêng ở 96×96 (PNG 192×192). Construction dùng hai khối và chốt nối; Traversal dùng giày đi theo các khối; Search dùng kính lúp soi khối; Insertion dùng khối xanh được thêm vào; Deletion dùng khối được nhấc ra kèm dấu trừ; Reversal dùng hai khối cùng mũi tên đổi chiều. Không tô lại màu icon trong Unity. Nguồn vẽ nằm ở `scripts/linked-map-lesson-art.mjs`; xem cả bộ trong `lesson-icons-preview.png`. Các icon điều khiển còn lại dùng Lucide như trước.

## Những gì còn được xử lý lúc chạy

CSS bố trí kích thước và tọa độ, chọn asset theo màn hình/trạng thái, đặt chữ/số và giới hạn phần thanh tiến độ đang hiện. CSS không vẽ bệ, mặt trạm, viền panel, nút hay đường đi ở màn này. Focus bàn phím và chuyển động khi tương tác vẫn là hành vi lúc chạy.

Bản đồ dùng hình đoạn đường riêng. Vị trí đoạn đường được đặt theo tọa độ hai trạm. SVG đường cho phép điều chỉnh bề rộng theo cột bản đồ và giữ độ dày nét; khi chuyển PNG sang Unity, đồng bộ bề rộng đoạn đường với khoảng cách ngang giữa các trạm. Đây là sprite nền đường; chuyển động Buta vẫn được tính bằng đường cong của game.

Các bài Linked List hiện mở độc lập theo logic game hiện có. Hình khóa và vô hiệu hóa được chuẩn bị cho trường hợp logic truy cập dùng đến chúng; bộ asset không thay đổi quy tắc mở bài.

## Dùng trong Unity

`unity-assets.json` ghi kích thước native/PNG và mục đích từng file. Import PNG dạng Sprite, Single, Full Rect, alpha transparency, mipmaps tắt. Dùng Image Simple và giữ tỉ lệ cho trạm, icon, bệ và bảng tên; chọn đúng profile cho panel/nút. PNG là 2x nên dùng `nativeSize` để đặt RectTransform. Nhãn dùng TextMeshPro, Button dùng Sprite Swap cho 4 trạng thái. Huy hiệu và icon là các Image con.

Không kéo riêng từng chiều của trạm hoặc icon. Panel/nút đã có profile desktop/mobile; nếu đổi tỉ lệ bố cục đáng kể, bổ sung profile ở script thay vì kéo méo ảnh.

Chạy lại từ gốc repo:

```sh
node scripts/build-linked-map-assets.mjs
```

Lệnh xuất lại SVG, PNG, manifest và `preview-desktop.png` / `preview-mobile.png`. Icon dựa trên Lucide; giấy phép được kèm trong `LICENSE-icons.txt`. Đây là bộ asset và metadata; chưa phải scene/prefab được kiểm thử trong Unity.
