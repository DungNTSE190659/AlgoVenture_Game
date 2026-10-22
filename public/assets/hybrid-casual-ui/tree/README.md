# Bộ asset phần Cây

Áp dụng cho chủ đề Cây, bản đồ 6 bài, Demo, Thử thách, HUD, lời thoại, cài đặt/gợi ý và màn hoàn thành. Các hình trực quan nằm trong SVG/PNG; CSS giữ bố cục, kích thước, chữ/số và hành vi tương tác.

## Thư mục

- `svg/`, `png/`: **146 cặp** sprite UI. PNG xuất ở 2x kích thước thiết kế. Icon nhỏ, trạng thái nút, panel, thân nút cây, vùng thả, khay và nhãn đều có file riêng.
- `map/svg/`, `map/png/`: **111 cặp** sprite bản đồ: bệ trạm, trạng thái trạm, huy hiệu, bảng tên, nút, icon bài học và các đoạn đường nối.
- `backgrounds/forest-landscape.png`, `forest-portrait.png`: nền rừng 2D mới, cùng phong cách minh họa với đảo Linked List. Prompt nằm ở `../2D-ART-PROMPTS.md`.
- `preview-desktop.png`, `preview-mobile.png`: bảng sprite UI theo profile. Các bảng map nằm trong `map/`.
- `unity-assets.json`, `map/unity-assets.json`: đường dẫn, kích thước native/PNG, loại Image, pivot/border nếu áp dụng.
- Đảo chủ đề mới: `../atlas/islands/trees.png`, nền trong suốt, cùng phong cách đảo Linked List. Prompt ở `ISLAND-PROMPT.md`.
- Buta tiếp tục dùng bộ ảnh và motion sheet hiện có ở `public/assets/buta/2d/`.

## Màu bài học

| Bài | Mặt trạm | Gờ/chữ |
| --- | --- | --- |
| Cây cơ bản | `#F7B83D` vàng mật ong | `#A96712` |
| Duyệt cây | `#88B76D` xanh lá sáng | `#527B40` |
| BST | `#B777ED` tím kẹo | `#7540A5` |
| Tìm kiếm BST | `#39B8F2` xanh trời | `#176B9C` |
| Thêm nút BST | `#76A65B` xanh lá | `#527B40` |
| Xóa nút BST | `#FF9658` cam đào | `#AD4E25` |

Giao diện bài học dùng một họ xanh lá gần với nền rừng: mặt nút `#76A65B`, gờ `#527B40`, biểu tượng `#4F733D`, khay sẵn sàng `#E8F0DA`, bảng cây `#F2F7EA`. Nút phát demo và trạng thái đang đi qua dùng xanh dương dịu; gợi ý dùng vàng. Có sprite thường, hover, nhấn, vô hiệu hóa. Màu khóa/vô hiệu hóa cố ý dịu để phân biệt với phần đang dùng được.

## Nút cây và nhánh

Thân nút có kích thước desktop 60, mobile 48 và compact 44. Từng profile có normal, visited, current, selected, empty, ready, over, source, target. Đây là hình được dựng theo kích thước đích, giữ tỉ lệ khi hiển thị. Giá trị nút và chữ quan hệ Gốc/Trái/Phải là text riêng.

`branch-normal.svg/png`, `branch-visited.svg/png`, `branch-empty.svg/png` là texture lặp của nhánh. Web phủ texture lên đường nối tính theo vị trí cha/con. Dây đang hoạt động và đã đi qua dùng xanh dương dịu cùng tông với nút trạng thái hiện tại. Khi chuyển Unity, dùng UI mesh hoặc LineRenderer đặt trong hệ tọa độ phù hợp và texture repeat, đồng bộ đầu nhánh với RectTransform của nút. Nhánh rỗng có nét đứt để gợi ý vị trí; đường nối không đóng cứng thành ảnh của cả cây.

Icon 6 bài là hình đồ chơi có màu: cây mầm, duyệt qua nhánh, cấu trúc BST, kính lúp tìm nút, thêm nút, tháo nút. Nguồn nằm ở `scripts/tree-map-lesson-art.mjs`. Không cần Color Tint.

## Unity

Import PNG dưới dạng Sprite/Single/Full Rect, alpha transparency, mipmaps tắt, Bilinear. PNG là 2x; đặt RectTransform theo `nativeSize`, không dùng Set Native Size trực tiếp. Theo từng entry của manifest:

- `Simple`: thân nút, icon, bệ, trạm và hình minh họa. Giữ tỉ lệ, chọn profile phù hợp.
- `Sliced`: panel, khung thoại, nút dài và khay/nhãn. `borderPixels` theo PNG pixel, thứ tự left/bottom/right/top. Chọn Image Sliced, fillCenter bật.
- Button: Sprite Swap với thường/hover/pressed/disabled. Trạng thái bàn chơi được chọn theo logic game.
- TextMeshPro: số, điểm, lời thoại, tên bài và nhãn quan hệ.
- Nền: ảnh ngang hoặc dọc, scale đồng đều phủ canvas. Đảo trong atlas dùng Image Simple, Preserve Aspect.

Đây là bộ asset và dữ liệu bàn giao; chưa phải scene/prefab đã chạy trong Unity. Hệ tọa độ cây và logic bài học vẫn cần được chuyển sang C# khi port.

## Tái xuất

Từ gốc repository:

```sh
node scripts/build-tree-ui-assets.mjs
node scripts/build-linked-map-assets.mjs --tree
node scripts/build-atlas-ui-assets.mjs
```

Các lệnh tái xuất SVG/PNG/manifest và bảng xem, không tạo lại đảo bằng AI. UI source nằm trong generator; CSS skin ở `src/treeAssets.css`, map skin ở `src/treeMapAssets.css`. Icon điều khiển kế thừa Lucide (giấy phép kèm); hình icon bài học là vector riêng. UI Linked List tiếp tục dùng bộ file riêng.

## Dây xoắn truyền tín hiệu

- `rope-helix-normal`, `rope-helix-active`, `rope-helix-visited`: tile liền mạch 18×10 (PNG 36×20), giữ nguyên tỉ lệ vân, lặp theo chiều dài dây. Dây thường màu thừng, dây truyền xanh ngọc, dây đã duyệt vàng.
- Web dùng ảnh tile trong SVG, dịch 18px mỗi chu kỳ; CSS chỉ điều khiển chuyển động. Tín hiệu sáng chạy lần lượt từ đầu tới cuối tuyến. Demo tạm dừng/cài đặt sẽ dừng chuyển động; chế độ giảm chuyển động chỉ giữ màu phân biệt.
- Tuyến lấy từ bước bài học: DFS đi qua tổ tiên chung khi quay lên/đổi nhánh; duyệt theo tầng phát từ cha tới nút trong hàng đợi; tìm/chèn BST theo bước so sánh. Nhánh rỗng/chưa nối không phát tín hiệu.
- Khi chuyển Unity: dùng ribbon/RawImage xoay theo hai đầu nhánh; Texture Wrap Mode Repeat, UV rộng bằng chiều dài đoạn / 18, dịch UV theo thời gian. Không nhét tile dây vào atlas có Clamp và không kéo giãn một tile dọc cả nhánh. Chuyển động và tuyến vẫn cần code C#; PNG không chứa sẵn animation.
- Khay tháo nút có thiết kế native cao 84px; bố cục dùng 84px desktop, 66px mobile và 58px màn hình thấp. Khung thoại dùng sprite Sliced với góc cố định, chữ tự xuống dòng và panel tự giãn chiều cao theo nội dung, không cuộn bên trong.
