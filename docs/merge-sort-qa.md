# Merge Sort — kiểm tra Merge Express

Ngày: 21/10/2026. Prototype web AlgoVenture. Phiên bản hiện tại thay lượt nhả thủ công bằng game phản xạ tự chạy; giữ Demo ô số.

Đối chiếu [Checklist for mobile game — Viblo](https://viblo.asia/p/checklist-for-mobile-game-bJzKmMqwK9N). Giả lập browser và cảm ứng CDP không thay thế điện thoại thật.

## Cách chơi hiện tại

1. Cảnh zoom giới thiệu dãy kiện chưa xếp xuất hiện khi vào màn. Bấm **Vào ca**. Splitter tự chia các nhóm đến từng kiện đơn trong 450 ms mỗi bước.
2. Hai băng chuyền nhập nối liền tại cổng chữ Y, rồi nối vào băng ra. Desktop/màn ngang chạy trái sang phải; điện thoại dọc chạy trên xuống dưới. Không có khay hoặc nút nhả. Sân chơi rộng bằng viewport và cao bằng phần còn lại dưới HUD, kéo tới mép màn hình.
3. Chỉ điều khiển một cần gạt: kéo ngang, chạm để đổi A/B, hoặc mũi tên/A/D/Space/Enter. Giữ cần ở làn có kiện đầu nhỏ hơn khi tới nhịp qua cổng. Hai giá trị bằng nhau ưu tiên A để giữ tính ổn định. Khi một làn hết, cổng tự dùng làn còn lại và báo TỰ ĐỘNG; vị trí tay gạt không tự đổi. Qua cổng hoặc sang nhóm mới đều giữ nguyên tay gạt. Kéo quay lại được tính theo vị trí thực trên nửa A/B, không theo khoảng lệch từ điểm bắt đầu chạm.
4. Dễ/Vừa/Khó: 5/7/8 kiện, mỗi nhịp 2,3/1,65/1,15 giây. Vòng nhịp và đèn cổng cho biết thời điểm/quyết định sắp tới. Hàng luôn tự trôi, người chơi không phải xác nhận từng kiện.
5. Mỗi kiện đúng được 100 điểm, chuỗi tăng. Chọn sai kết thúc ca ngay, hiện giá trị đã chọn và giá trị cần chọn; chơi lại reset toàn bộ ca. Không còn hàng chờ bốn ô hoặc thử lại riêng nhóm của bản trước. Thắng chiếu dãy đã sắp xếp trong 3,6 giây trước bảng điểm; có nút Xem kết quả để bỏ qua. Cảnh cuối giữ danh tính khi bằng nhau và tạm dừng khi mở cài đặt/ẩn tab. Hoàn thành được lưu khi thuật toán kết thúc; bảng điểm sau cảnh kết thúc cho mở Quick hoặc tăng độ khó.
6. Sau mỗi nhóm, băng ra tăng tốc để giải phóng sản phẩm trong 1,4 giây rồi nạp hai nhóm mới. Cài đặt, gợi ý và tab ẩn dừng cả đồng hồ lẫn vật thể. Khi tiếp tục, không bù thời gian tab ẩn. Khung hình bị khựng được giới hạn bước mô phỏng 80 ms để tránh phạt người chơi vì trình duyệt treo ngắn.

Mảng phụ là kết quả hợp nhất trong engine, không dùng khay bộ nhớ làm vùng tương tác. Chỉ phần tử đầu của mỗi nhóm được đưa qua, mỗi nhịp đúng một phần tử; kết quả dùng lại cho lượt gộp tiếp theo. Chuyển động trang trí không quyết định tính đúng/sai.

## Hình ảnh và chuyển động

- Tải 3 asset WebP: parcel 256×240, gate 512×468, factory 1672×940; tổng 205.780 byte, khoảng 206 KB. Prompt và nguồn PNG trong `public/assets/merge-factory/prompts.json`. Ảnh conveyor.webp cũ được giữ trong thư mục nguồn nhưng không còn được tải khi chơi.
- Các nhánh, thân, nan và mép ray dùng SVG liên tục. Nhánh desktop được nới rộng trước cổng; mỗi điểm chờ cách trục đường ra ít nhất một kích thước hộp cộng 14 px để kiện chờ không đè lên kiện nhánh kia hoặc kiện đi qua. Hai điểm cuối băng nhập trùng chính xác điểm đầu băng ra tại cổng, cùng hình học với đường đi của sprite. Nội suy theo chiều dài cung để kiện chạy đều trên đoạn cong.
- Kiện nối đuôi, dừng ở chốt khi nhánh chưa được chọn, tự qua cổng theo nhịp và tiếp tục trôi ra ngoài màn hình. Cần gạt nghiêng qua lại, đèn/vòng nhịp đổi trạng thái; có phản hồi sai và màn thua.
- Reduced motion bỏ hiệu ứng phụ; chuyển động kiện theo thời gian vẫn được giữ vì là thông tin gameplay thiết yếu.

## Demo giữ riêng

Hàng tổng nhỏ phía trên, viền vàng ở phạm vi đang ghép, xanh cho đoạn đã ghép có thứ tự. Ô số từ nguồn đi xuống hàng kết quả; không khay, ảnh nhà máy hay nội dung kiện hàng. Bấm lùi khôi phục đúng giá trị/màu/vị trí. Mỗi danh tính có đúng một ô chuyển động, hàng tổng là bản hiển thị tĩnh. Khung thoại Buta cùng kích thước với Bubble.

## Kết quả tự động

- Unit: **130/130 đạt**, 17 file. Bao gồm mọi mảng hai giá trị dài 2–8, số âm/trùng/biên/lẻ, tính ổn định, bảo toàn danh tính và input; bắt đầu, gạt không chuyển kiện, sai nhịp thua, đóng băng sau thua, tự chạy nốt làn còn lại nhưng giữ nguyên tay gạt, chỉ thắng sau gộp cuối.
- Kiểm tra hình học: mọi đường nhập và ra trùng đầu mút tại cổng, vào từ ngoài viewport và ra ngoài viewport theo đúng hướng ở desktop/phone/landscape.
- E2E: **18 trường hợp đạt** (13 Merge, 5 HUD) qua các lượt kiểm tra: suite chung 16/16, sau đó bổ sung hai trường hợp riêng về camera mở đầu/kết thúc và tay gạt; chạy lại kiểm tra khoảng cách ray cùng hai trường hợp mới đạt 3/3. Kiểm tra camera xác nhận dãy chưa xếp/đã xếp, danh tính trùng, tự chuyển sang bảng điểm và tạm dừng khi mở cài đặt.
- Build production đạt; Vite vẫn cảnh báo JS bundle trên 500 KB. Chưa chia bundle hoặc benchmark phần cứng.

## Đối chiếu checklist

| Hạng mục | Đã kiểm tra | Giới hạn |
|---|---|---|
| Menu, hướng dẫn, điều hướng | Vào ca, hướng dẫn cần gạt, cài đặt, Buta, chơi lại, thắng/mở Quick | Browser E2E |
| Gameplay | Tự chạy; không có ba nút điều khiển cũ; sai đầu tiên thua; mảng âm/trùng; chỉ gạt không cộng điểm | Unit và E2E |
| Chuột, touch, bàn phím | Kéo cần, tap đổi bằng CDP, phím mũi tên, tự chọn nhánh còn lại | Chưa thao tác trên điện thoại thật |
| Full screen và hướng | 1440×900, 1280×580, 390×844, 320×568, 844×390; lượt gộp đủ 8 kiện | Băng chuyền lấp chiều rộng và phần còn lại dưới HUD, không tràn/cuộn; kiểm tra cần gạt trong viewport |
| Đồ họa | Asset local load, đoạn cong nối cổng chính xác, sprite thực sự đổi vị trí theo thời gian | Chưa đo FPS/GPU trên máy yếu |
| Gián đoạn | Cài đặt, gợi ý, Visibility API dừng vị trí và nhịp; tiếp tục còn đúng thời gian | Chưa kiểm tra cuộc gọi/Home/khóa máy thật |
| Điểm và save | +100/kiện đúng, thua không lưu hoàn thành, thắng lưu/mở Quick, ca mới reset | Không lưu ca đang chơi sau reload |
| Nhập dữ liệu/độ khó | 2–8 số nguyên −99…99, nhập sai không reset, mức 7/8 kiện và nhịp nhanh hơn | Chưa có dữ liệu cân bằng từ playtest người mới |
| Demo | Toàn bộ 67 frame mảng 8 số ở 5 viewport; xanh đúng đoạn; tiến/lùi; pause/tốc độ | Browser E2E |
| HUD và Buta | Header/điểm/gợi ý dùng thiết kế chung, thoại bằng Bubble | Browser E2E |
| Âm thanh/rung | Hệ thống phản hồi và cài đặt chung; hình ảnh vẫn báo trạng thái khi tắt tiếng | Chưa nghe/đo rung trên máy thật |
| Accessibility | Một slider có tên/giá trị, focus phím, dialog thất bại, reduced motion | Chưa kiểm tra screen reader đầy đủ; game vẫn đòi hỏi phản xạ |
| Mạng/offline | Ảnh local, không gọi host ảnh bên ngoài trong gameplay | Không có service worker; không cam kết tải mới offline |
| Pin/bộ nhớ/độ bền | Không thêm thư viện runtime; ảnh khoảng 206 KB tải khi chơi | Chưa kiểm tra chơi lâu, pin/nhiệt, RAM thấp |
| Native/store/thanh toán/multiplayer | Không thuộc prototype này | Không áp dụng hoặc chưa kiểm tra |

## Tái kiểm tra

```sh
npm test
npm run build
npx playwright test tests/merge.spec.ts tests/game-hud.spec.ts
```

Ảnh local Git ignore: `.qa/merge-express-{1440,1280,390,320,844}.png`, `.qa/merge-demo-{1440,1280,390,320,844}.png`, `.qa/merge-flow-page-4.png`, `.qa/merge-flow-page-5.png`, `.qa/merge-flow-first-group.png`.

Trước khi phát hành mobile: cần thử Android/iOS thật về gạt bằng một tay, đọc số khi hàng di chuyển, tốc độ phản ứng, xoay màn hình giữa nhịp, safe area/thanh địa chỉ, cuộc gọi/Home, âm thanh/rung, máy yếu và chơi dài. Những mục này chưa được tính là đạt.

Ảnh bổ sung: `.qa/merge-intro-{1440,1280,390,320,844}.png`, `.qa/merge-outro-1440.png`. Đã xem trực tiếp ảnh ray desktop với hai nhánh/kiện tách nhau, intro 320×568 và 844×390, outro desktop; kiểm tra camera chuyển động và đứng yên khi mở cài đặt. Các mục về điện thoại thật và cân bằng phản xạ vẫn cần playtest.
