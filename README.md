# AlgoVenture

Game casual về cấu trúc dữ liệu và thuật toán bằng tiếng Việt. Bản đồ thế giới gồm **Mảng → Danh sách → Cây → Đồ thị**, với lộ trình học bên trong từng vùng. Linh vật Buta là chú heo thám hiểm, có mũ, khăn cổ, ba lô và la bàn, di chuyển trên đường giữa các vùng và giữa các ải.

## Learning track

- Màn đầu hiển thị một bản đồ chủ đề lớn: Quần Đảo Những Ô Số (Mảng), Bến Liên Kết (Linked List), Rừng Cây Tri Thức (Cây, BST), Cao Nguyên Kết Nối (Đồ thị). Vuốt trái/phải để chuyển chủ đề; cũng có kéo chuột, mũi tên và các nút chỉ trang. Bấm trực tiếp bản đồ hoặc nút vào vùng để mở lộ trình bên trong.
- Bên trong mỗi vùng, bản đồ cuộn dọc theo đường chữ S. Mỗi đảo có icon, tên, trạng thái khóa hoặc hoàn thành. Bảng đáy hiện hai nút **Xem demo / Thử thách**; được vào thẳng thử thách.
- **Mảng có ba lộ trình**, chọn bằng nút **Sort / Search / Stack & Queue** phía trên bản đồ. Sort: Bubble → Selection → Insertion → Merge → Quick. Search: Linear Search → Binary Search. Mỗi nhánh có đường đi, số thứ tự đảo, Buta và tiến trình riêng; bản đồ thế giới tính tổng 9 bài. Stack & Queue có hai đảo riêng. Cả Stack và Queue đã có Demo và Thử thách. Bảng đáy của nhánh này chỉ giữ tên bài và nút hành động. Đã bỏ đảo/bài Array riêng.
- **Danh sách:** Linked List Construction → Traversal → Search → Insertion → Deletion → Reversal. Mỗi nốt có một bài thực hành và hai nút Demo / Thử thách. **Cây:** Cây cơ bản → BST → Tìm kiếm → Thêm nút → Xóa nút. **Đồ thị:** Đồ thị cơ bản (đỉnh, cạnh, biểu diễn) → DFS → BFS → Dijkstra.
- Đây là thứ tự học do game thiết kế, không phải khẳng định mọi thuật toán sau phụ thuộc vào tất cả thuật toán trước. Sorting và Searching cũng có thể áp dụng cho các cấu trúc khác; trong vùng Mảng, các bài học minh họa trên mảng. Không cần hoàn thành BST để học Bubble Sort.
- Sort mở Bubble sẵn; vượt Bubble mở Selection, vượt Selection mở Insertion, vượt Insertion mở Merge, vượt Merge mở Quick. Search mở Linear Search sẵn; Binary Search chỉ yêu cầu Linear Search, không yêu cầu bài Sort. Cả sáu nốt Danh sách mở sẵn, có thể vào Demo hoặc Thử thách theo thứ tự tùy chọn; các chủ đề sau vẫn theo điều kiện hoàn thành. Tiến trình cũ được giữ theo ID; các bài mới cần được vượt thử thách để hoàn thành.
- Sau chiến thắng, nút **Đi tiếp cùng Buta** đưa Buta tới đảo mới trong cùng lộ trình. Kết thúc Sort không tự chuyển sang Search; dùng nút chọn nhánh để chuyển. Chỉ khi đủ điều kiện hoàn thành toàn bộ chủ đề mới mở vùng tiếp theo. Có nút Về Buta, cuộn chuột, vuốt chạm, bàn phím và hỗ trợ giảm chuyển động.
- Tiến trình lưu trong localStorage (`algoventure.world-progress.v3`). Các hoàn thành ở bản cũ (`algoventure.world-progress.v2` và `algoventure.learning-track.v1`) được giữ theo ID bài học; chúng không tự cấp hoàn thành cho những ải mới đứng trước.
- **Bản thử hiện tại:** Bubble, Selection, Insertion, Merge và Quick có Demo / Thử thách. Sáu nốt Linked List có một bài Demo và một Thử thách mỗi nốt. Construction lắp khối và nối dây; Traversal, Search, Insertion và Deletion lắp danh sách trước, đặt heo lên HEAD rồi bấm mũi tên duyệt theo next; chèn/xóa mở sau khi duyệt tới đúng vị trí, Reversal mở danh sách nối sẵn: tự tháo đinh, đưa khối về khay, đổi vị trí và nối lại theo thứ tự đảo ngược; chỉ hoàn thành sau khi bấm Kiểm tra. Cây và các bài Đồ thị khác đang phát triển.
- `src/engine/learningTrack.ts`: bốn chủ đề, 22 ải, luật mở khóa và lưu tiến trình. `src/engine/linkedCurriculum.ts`: dữ liệu màn và tương thích tiến trình cũ. `src/components/WorldMap.tsx` / `src/atlas.css`: chọn chủ đề bằng các bản đồ lớn vuốt ngang. `src/components/AdventureMap.tsx` / `src/track.css`: lộ trình cuộn dọc bên trong.

Quick Sort Demo dùng **Lomuto partition** với phần tử cuối làm chốt và phép so sánh **≤**.

## Chạy trên máy

Yêu cầu Node.js 22.12+ (hoặc Node.js 24).

```sh
npm install
npm run dev
```

Mở địa chỉ được Vite in ra, mặc định http://127.0.0.1:5173.

Muốn thử trên điện thoại cùng Wi-Fi: chạy `npx vite --host 0.0.0.0`, mở `http://<IP-máy-tính>:5173` trên điện thoại và cho phép cổng 5173 trong tường lửa nếu cần.

## 03 · Cây — Rừng Cây Tri Thức

- Chọn **Cây** ở bản đồ thế giới; vùng mở độc lập. Bắt đầu ở **Cây cơ bản**, hoàn thành Thử thách để mở bài kế tiếp. Demo không ghi hoàn thành.
- Cây cơ bản: kéo hạt từ túi lên gốc/con trái/con phải, nối nhánh và gắn nhãn gốc/lá/cha/độ sâu. Duyệt cây: kéo thẻ giá trị vào giỏ theo preorder, inorder, postorder hoặc từng tầng.
- BST: đổi chỗ hai nút sai và trồng cây đúng quy tắc. Tìm kiếm: dẫn Buta qua từng cạnh và cắm cờ khi tìm thấy hoặc gặp nhánh rỗng. Thêm: dẫn hạt tới vị trí rỗng. Xóa: tháo nút lá, nối lại cây có một con hoặc chuyển successor/predecessor rồi nối lại nhánh. Khi xóa nút hai con, kéo Buta sang phải để tìm số nhỏ nhất bên phải, hoặc sang trái để tìm số lớn nhất bên trái; cả hai cách đều hợp lệ. Demo cho chọn cách trong Tùy chọn.
- Kéo thả bằng chuột/cảm ứng; có thể chọn vật rồi chọn nơi đặt bằng chạm hoặc Enter/Space. Thả hụt/hủy kéo phục hồi; Hoàn tác lùi một bước; Làm lại bắt đầu lại chặng hiện tại. Bấm **Kiểm tra cây** sau mỗi chặng; chỉ chặng cuối mới ghi hoàn thành bài.
- Demo có phát/tạm dừng, bước trước/sau và tốc độ 1×/1.5×/2×. Mở Tùy chọn hoặc ẩn tab dừng tự chạy; đóng hộp thoại không tự phát tiếp. Tốc độ và âm thanh được lưu cục bộ.
- Điểm có biểu tượng sao nằm ngay cạnh Tùy chọn. Tiêu đề/đề bài gọn; bàn cây, túi đồ và điều khiển tự chia chiều cao màn hình, không cần cuộn ở các kích thước kiểm chứng.
- Bộ kiểm chứng: `src/engine/tree.test.ts`, `tests/tree.spec.ts`; báo cáo: `TREE_GAME_REPORT.md`.

## Linked List – Lối Đi Mắt Xích

- Vào chủ đề **Danh sách** rồi chọn bất kỳ nốt Linked List nào. Sáu nốt đều mở sẵn; mỗi nốt có Demo và Thử thách.
- Mỗi màn Construction có số khối riêng: 2, 3 hoặc 4. Các chú giải trên màn giải thích khối dữ liệu, lỗ nhận liên kết, dây và đinh biểu diễn con trỏ `next`, nút đầu `HEAD` và nút cuối `NULL`.
- Kéo khối từ khay lên hàng lắp theo thứ tự gợi ý rồi kéo đinh vào lỗ của khối tiếp theo. Đinh của khối cuối để rời làm `NULL`. Có thể chạm khối rồi chạm ô, hoặc chạm đinh để rút ra và chạm lỗ khác; chuột, cảm ứng và bàn phím đều dùng được.
- Kéo khối đã lắp sang ô khác để đổi chỗ. Liên kết đi theo khối, không đi theo vị trí. Trả khối về khay sẽ tháo các liên kết tới khối đó. Không cho phép tự nối hoặc tạo vòng.
- Logic lắp ghép trong `src/engine/linkedList.ts`, giao diện trong `src/components/LinkedListGame.tsx` và `src/linkedList.css`. Luồng lắp → đặt heo → duyệt → chèn/xóa dùng `src/components/LinkedJourneyGame.tsx`; Demo phát lại cùng luồng. Dữ liệu các bài nằm trong `src/engine/linkedChallenges.ts` và `src/components/LinkedAlgorithmGame.tsx`.

## Bubble Sort

- Vào chủ đề Mảng rồi chọn đảo Bubble Sort. Cả năm thuật toán Sort đều có nhánh Demo / Thử thách và dấu hoàn thành riêng.
- Demo minh họa từng cặp cạnh nhau: quan sát, giải thích vì sao đổi hoặc giữ nguyên, chuyển động đổi chỗ, số lớn nhất về cuối sau mỗi lượt. Hai số bằng nhau giữ thứ tự. Một lượt không đổi chỗ cho phép dừng sớm. Có lùi bước, tạm dừng, tốc độ 1x / 1.5x / 2x và mảng riêng từ 2 đến 8 số.
- **Play – Đường đua bong bóng:** chọn bong bóng lớn hơn của cặp đang sáng, giữ và kéo sang phải. Bong bóng lớn bên trái vượt hàng xóm bằng một lần đổi chỗ; bong bóng lớn đã ở bên phải tiếp sức mà không đổi vị trí hai số. Giữ tay để đi qua nhiều ô trong một lần kéo; khi gặp hàng xóm lớn hơn, thả tay và chuyển sang kéo bong bóng đó. Nút Giữ nguyên luôn hiện dưới mảng khi xét một cặp: bấm khi số trái nhỏ hơn hoặc bằng số phải để chuyển sang cặp kế tiếp. Bấm sai giữ nguyên trạng thái và giải thích để thử lại. Thao tác kéo tiếp sức cũ vẫn hoạt động. Bàn phím dùng Tab chọn bong bóng rồi nhấn phím sang phải hoặc Enter. Cuối mỗi lượt, số lớn nhất chuyển xanh tại đích; lượt sau quay về đầu, phần cần xét ngắn hơn.
- Mỗi cặp đúng được 100 điểm; thao tác sai trừ 25 điểm. Buta chỉ giải thích khi bấm gợi ý. Có âm thanh và biểu cảm ăn mừng khi hoàn tất.
- Logic so sánh dùng chung cho Demo và Play trong `src/engine/bubbleSort.ts`; giao diện trong `src/components/BubbleGame.tsx`, thao tác tiếp sức liên tục trong `src/components/BubbleRunBoard.tsx`, bố cục trong `src/bubble.css`.

## Kết thúc màn chơi

Cả năm thuật toán Sort dùng chung Buta ăn mừng và sao thưởng. Chơi lại bắt đầu lại đúng mảng vừa chơi; Tăng độ khó tạo mảng mới ở mức kế tiếp (Dễ, Vừa, Khó), và không xuất hiện khi đã ở mức Khó. Đi tiếp cùng Buta trở về hành trình để di chuyển tới màn có nội dung tiếp theo vừa mở.

## Selection Sort – Chọn bé nhất, xếp trước

- **Thử thách:** tìm số nhỏ nhất trong các ô chưa xanh, chạm để chọn rồi chạm ô đầu phần chưa xếp hoặc bấm Đưa về ô. Có thể kéo thẳng số nhỏ nhất vào khung vàng trong một lần giữ. Hai số đổi chỗ theo cung; mỗi lượt cố định thêm một ô xanh. Nếu số nhỏ nhất đã ở đúng ô, chọn Giữ nguyên vị trí; số cuối cùng tự hoàn tất.
- Chọn đúng cộng 100 điểm; đặt đúng cộng 150 điểm; mỗi 3 lượt liên tục không sai thưởng 50 điểm. Chọn sai trừ 25 điểm và giải thích để thử lại, không mất mảng. Thả hụt không trừ điểm và vẫn giữ lựa chọn. Không có giới hạn giờ hay hết lượt; Buta gợi ý miễn phí khi được gọi.
- **Demo:** lần lượt xét toàn bộ phần chưa xếp, theo dõi số nhỏ nhất tạm thời, rồi mới đổi chỗ với ô đầu. Có lùi/tiến từng bước, phát/tạm dừng cả animation, tốc độ 1x / 1.5x / 2x. Demo không cấp hoàn thành; cuối demo có nút Tự mình thử.
- Chấp nhận số âm, số trùng; khi có nhiều số nhỏ nhất bằng nhau, chọn số nào cũng đúng. Demo chọn lần xuất hiện đầu tiên. Phép đổi trực tiếp của Selection Sort không bảo đảm giữ thứ tự tương đối của các phần tử bằng nhau.
- Mảng riêng từ 2 đến 8 số nguyên −99…99; Dễ/Vừa/Khó lần lượt 5/7/8 số. Có chơi lại đúng mảng, tăng độ khó, điểm/sao, âm thanh và rung theo cài đặt chung. Kéo chuột, cảm ứng, chạm và bàn phím đều được hỗ trợ; mảng dài cuộn ngang và tự cuộn theo tay kéo.
- `src/engine/selectionSort.ts`: engine thuần và timeline Demo dùng chung phép chọn/đổi. `src/components/SelectionGame.tsx` / `src/selection.css`: màn chơi, cài đặt, animation và bố cục riêng; không thay đổi bố cục các game khác.

## Insertion Sort và phản hồi thao tác

- Bản cũ ở `D:\FPT University\Semester 9\SEP490\proto_algo` có Bubble Sort giống bản này; Insertion Sort ở bản cũ chỉ là nút sắp ra mắt. Màn Insertion hiện tại được bổ sung mới theo phong cách chung.
- **Demo:** nhấc từng số, dịch các số lớn hơn sang phải, rồi chèn vào ô trống. Có bước trước/sau, phát/tạm dừng, tốc độ 1x / 1.5x / 2x và mảng riêng từ 2 đến 8 số nguyên −99…99. Xem demo không cấp hoàn thành.
- **Thử thách:** kéo số tiếp theo lên khay phía trên để nhấc số, kéo số bên trái sang ô trống để nhường chỗ, rồi kéo số đang cầm xuống ô trống khi đã tới vị trí đúng. Cả ba thao tác hỗ trợ chuột/cảm ứng, không cần các nút Nhấc/Dịch/Chèn. Bàn phím vẫn có thể dùng Enter/Space trên các khối số. Chèn sớm hoặc dịch sai không thay đổi mảng, trừ 25 điểm; gợi ý cách sửa chỉ hiện khi gọi Buta; thả ngoài vùng nhận hoặc hủy kéo giữ nguyên mảng/điểm. Mỗi bước đúng cộng 100 điểm; hai số bằng nhau giữ thứ tự ban đầu.
- Phần có thứ tự chuyển xanh, số đang cầm màu vàng, ô nhận chỉ được tô gợi ý khi mở Buta; nút Buta gợi ý ở cuối màn theo khung chung. Đã bỏ chú giải, dòng “ĐANG CẦM”, nút thao tác và lời khen lặp; giữ mục tiêu chung phía trên và phản hồi khi sai; tất cả số đều có thể kéo, mũi tên/viền chọn sẵn và lời nêu số cần kéo đã được bỏ. Khay nhấc số là vùng trống phía trên; khung vàng chỉ hiện khi mở Buta gợi ý. Giữ âm thanh/rung, hiệu ứng tiếp đất và sao thưởng.
- Bubble, Selection, Insertion và Quick có âm thanh cùng rung ngắn khi thao tác, thử sai và hoàn thành. Rung bật/tắt độc lập với âm thanh, lưu trên thiết bị trong `algoventure-haptics`; Demo chỉ phát âm thanh. Vibration API chỉ hoạt động trên thiết bị/trình duyệt hỗ trợ; không có phần cứng rung vẫn chơi bình thường. Rời màn, mở cài đặt hoặc ẩn tab dừng rung và âm thanh đang phát.
- Logic thuần ở `src/engine/insertionSort.ts`; giao diện và chuyển động ở `src/components/InsertionGame.tsx` / `src/insertion.css`; phản hồi dùng chung ở `src/audio/gameFeedback.ts`.
- Bản đồ có tiếng lướt trái/phải khi đổi chủ đề bằng vuốt, kéo chuột, mũi tên hoặc bàn phím; chọn đảo có tiếng riêng, đảo khóa có tiếng báo nhẹ. Bước chân trái/phải chạy theo nhịp Buta 240 ms và dừng khi đến nơi hoặc rời màn; đến đảo/chủ đề mới có một đoạn nhạc ngắn. Nút mở/đóng bảng và nút bấm thường có tiếng riêng, tránh phát chồng với âm thanh thao tác thuật toán. Nút bật tiếng có âm xác nhận; toàn bộ âm thanh này dùng chung cài đặt âm thanh hiện có, không có nhạc tự phát khi mới tải trang.

Bubble Sort Play bỏ chú thích màu dưới mảng. Bubble Sort Demo dùng nền sáng như Quick Sort Demo và các bong bóng tròn.

## Merge Sort – Trạm Phân Loại

- **Demo:** mảng tổng thu nhỏ phía trên, viền vàng đánh dấu đoạn đang xét; đoạn đã ghép có thứ tự chuyển xanh và cập nhật giá trị. Bên dưới, ô số từ hai mảng con đi xuống hàng kết quả đúng phạm vi trong toàn mảng, giữ chỗ trống ở nguồn sau khi chuyển. Không dùng khay. Màu xanh biểu thị đoạn đã có thứ tự, chưa nhất thiết là vị trí cuối cùng. Tiến/lùi khôi phục đúng vị trí và màu; có phát/tạm dừng/tốc độ. Khung thoại dùng kích thước chung với Bubble. Xem Demo không cấp hoàn thành.
- **Merge Express:** khi vào màn có cảnh zoom dãy kiện chưa sắp xếp; bấm Vào ca, Splitter tự chia kiện rồi các lượt gộp nối tiếp trong cùng một sân chơi. Hai nhánh băng chuyền nối liền vào cổng và đường ra bằng đường cong liên tục, tách rộng trước cổng; điểm chờ tính theo kích thước hộp để kiện hai làn và kiện đang qua cổng không chồng nhau. Desktop/màn ngang chạy trái → phải; điện thoại dọc chạy trên → dưới. Sân chơi phủ phần còn lại của viewport và không cuộn.
- **Một cần gạt:** kéo ngang hoặc chạm cần để đổi A/B; bàn phím mũi tên hoặc A/D chọn làn, Space/Enter đổi làn. Hàng tự chạy, không có nút Trái/Phải/Nhả kiện. Trước mỗi nhịp qua cổng, giữ cần ở làn có kiện đầu nhỏ hơn; bằng nhau ưu tiên A. Khi một làn hết, làn còn lại tự tiếp tục và cổng báo TỰ ĐỘNG. Vị trí tay gạt chỉ đổi theo thao tác người chơi, giữ nguyên cả khi hết làn hoặc chuyển nhóm; kéo đảo hướng xét theo nửa trái/phải thực tế của cần.
- Dễ/Vừa/Khó có 5/7/8 kiện, nhịp qua cổng 2,3/1,65/1,15 giây. Vòng nhịp thu dần quanh cổng; thanh dẫn và đèn báo nhánh đang mở. Chọn sai ở thời điểm qua cổng kết thúc ca ngay; Chơi lại bắt đầu ca mới. Mảng riêng nhận 2–8 số nguyên −99…99.
- Mỗi kiện qua đúng cộng 100 điểm và tăng chuỗi. Sau nhóm, băng ra tăng tốc để chuyển sang nhóm lớn hơn. Thắng có cảnh zoom dãy kiện đã sắp xếp trước bảng điểm (3,6 giây, có nút Xem kết quả để bỏ qua), lưu hoàn thành và mở Quick; thất bại không cấp hoàn thành. Cài đặt, gợi ý và tab ẩn tạm dừng cả vị trí kiện lẫn thời gian còn lại. Xoay màn hình đổi hình học băng chuyền và giữ tiến trình thuật toán.
- Sân chơi dùng 3 ảnh WebP (kiện, cổng, nhà xưởng), khoảng 206 KB. Băng chuyền vẽ bằng SVG để các nhánh nối chính xác ở mọi tỉ lệ màn hình; kiện đi theo quãng đường trên cùng đường cong đó. Cần gạt có độ nảy nhẹ; reduced motion tắt hiệu ứng phụ, giữ chuyển động kiện thiết yếu cho gameplay. Ảnh conveyor.webp của bản trước còn trong thư mục nguồn nhưng không được tải khi chơi.
- `src/engine/mergeSort.ts`: Merge Sort và timeline Demo. `mergeRace.ts`: luật ca tự động. `conveyorTracks.ts`: hình học đường chạy. `src/components/MergeGame.tsx`, `MergeConveyor.tsx`, `useConveyorClock.ts`, `MergeDemoBoard.tsx`, `useMergeMotion.ts`, `src/merge.css`: giao diện, đồng hồ và chuyển động. [Prompt ảnh](public/assets/merge-factory/prompts.json), [biên bản kiểm tra](docs/merge-sort-qa.md).

## Cách chơi Queue

- **Bản đồ:** Mảng → Stack & Queue → Queue. Mở độc lập với Stack/Sort/Search. Chỉ hoàn thành thử thách mới ghi nhận bài Queue.
- **Demo:** 17 bước bằng các ô số đơn giản, giải thích FIFO, FRONT, REAR, ENQUEUE, DEQUEUE, xem đầu hàng, underflow và overflow. Mốc FRONT/REAR bám theo phần tử thật; khi chỉ có một phần tử, nó giữ cả hai vai trò. Có phát/tạm dừng, tốc độ, bước trước/sau, Buta và bong bóng thoại theo Search. Không hiển thị mã.
- **Thử thách – Quầy nước của Buta:** chọn nước khách ở FRONT đang muốn. Phục vụ đúng thì khách đầu hàng rời quầy (DEQUEUE), các khách còn lại giữ thứ tự. Bấm Đón khách để thêm người mới vào cuối hàng (ENQUEUE). Đơn hàng khác cả hình và màu; khách có số thứ tự riêng.
- Ba mức Dễ/Vừa/Khó cần phục vụ 6/8/10 khách, tối đa 4 người trong hàng, 3 tim. Khách mới đến nhanh hơn và thời gian chờ ngắn hơn ở mức cao. Đưa sai nước, cố nhận thêm khi đầy, phục vụ lúc rỗng hoặc bỏ lỡ khách mất tim; thao tác sai không đảo thứ tự. Thời gian chờ phục vụ chỉ chạy với khách đầu hàng, để người phía sau không bị phạt vì chưa đến lượt.
- Mỗi đơn đúng +100 điểm; mỗi chuỗi 3 đơn liên tiếp thưởng +50. Có thắng/thua, chơi lại, tăng/giảm độ khó, kỷ lục cục bộ và nút gợi ý. Vào màn là chơi, không có cửa sổ bắt đầu. Cài đặt, gợi ý và tab ẩn tạm dừng cả hai loại thời gian.
- Dùng cảnh đồng cỏ, HUD và âm thanh chung; quầy, ly nước và khách được vẽ bằng SVG/CSS, không tải ảnh ngoài. Desktop đặt quầy và thao tác cạnh nhau; điện thoại dọc xếp gọn từ trên xuống. [Biên bản kiểm tra](docs/queue-qa.md).

## Cách chơi Stack

- **Bản đồ:** Mảng → Stack & Queue → Stack. Demo và Thử thách mở độc lập với Sort/Search; hoàn thành thử thách mới ghi nhận tiến trình.
- **Demo:** 22 bước minh họa bằng số và dấu ngoặc đơn giản. Giải thích TOP, PUSH, POP, PEEK, LIFO, underflow, overflow và kiểm tra ngoặc. Có phát/tạm dừng, bước trước/sau, tốc độ. Dùng cùng cấu trúc thoại với Search: Buta lớn, bong bóng có đuôi thoại và tự co giãn theo nội dung. Minh họa được phóng lớn theo không gian màn hình; không hiển thị mã lệnh trong Demo.
- **Thử thách – Bracket Defender:** vào màn là bắt đầu trực tiếp, không có cửa sổ Vào ca. Chờ dấu rơi vào vùng xanh rồi bấm PUSH cho ngoặc mở, POP cho ngoặc đóng khớp đỉnh. Cả ba loại `() [] {}` xuất hiện từ cấp 1. Từ cấp 3 có FLAG để phát hiện ngoặc đóng sai, đóng khi stack rỗng hoặc hết dòng còn ngoặc chưa đóng. Không được FLAG trước lỗi đang xét.
- Ba tim, điểm thưởng theo nhịp, combo tối đa ×5; cuối mỗi dòng hiện một dòng chữ kết quả ngay trên nút thao tác, tự mờ và chuyển dòng sau 1,5 giây; không có bảng che sân chơi hoặc nút chuyển dòng. PEEK/gợi ý chỉ xem đỉnh, không lấy phần tử và tạm dừng thời gian. Bánh răng và tab ẩn cũng tạm dừng.
- Chơi khó hơn tăng cấp, tốc độ, chiều dài và độ sâu; dòng đặc biệt ở mỗi cấp chia hết cho 5. Chơi lại giữ cùng dữ liệu để luyện tập. Cấp cao nhất và điểm tốt nhất lưu cục bộ. Phiên bản này tập trung một cột rơi; chưa thêm hai cột, sương mù hoặc hệ thống vật phẩm/quảng cáo của bản ý tưởng.
- Có âm riêng cho PUSH, POP, PEEK, lỗi và hoàn thành dòng; Demo phát theo bước thao tác cả khi chạy tự động. Dùng thiết lập âm thanh chung và dừng âm khi tạm dừng, mở cài đặt hoặc ẩn tab.
- Bố cục dùng màu pastel, Buta và HUD hiện có, vừa điện thoại dọc/ngang và desktop. Luật và dữ liệu nằm ở `src/engine/stack.ts`, cân chỉnh ở `stackConfig.ts`, timeline ở `stackLesson.ts`; giao diện ở `src/components/StackGame.tsx` và `src/stack.css`. [Biên bản kiểm tra](docs/stack-qa.md).

## Cách chơi Quick Sort

- **Bản đồ:** hoàn thành Bubble, Selection, Insertion và Merge để mở Quick. Chạm đảo Quick Sort rồi chọn Xem demo hoặc Thử thách trong bảng đáy.
- **Demo:** Một bài học riêng, tách nhịp quan sát → kết quả so sánh → chuẩn bị đổi → chuyển động → cố định chốt → chia mảng con. Phép so sánh lớn, nhóm ≤ chốt / > chốt hiện dưới mảng. Có phát/tạm dừng (dừng cả chuyển động), bước trước/sau. Nút tốc độ nằm ngay dưới nút phát, bấm để đổi lần lượt 1x, 1.5x, 2x. Mảng riêng nhận từ 2 đến 8 số nguyên trong khoảng từ −99 đến 99, không phụ thuộc số phần tử của mảng mẫu; tốc độ được giữ khi đổi mảng. Cuối bài có nút chuyển sang Play.
- Lời Buta dùng câu nói đầy đủ, không viết tắt, ký hiệu so sánh hay mũi tên. Đầu bài giải thích Quick Sort có nhiều cách chọn chốt; cách Lomuto trong game giữ chốt ở cuối để xét các số phía trước rồi mới đặt chốt vào vị trí đúng.
- **Play – Chia kho báu:** Kéo một khối bất kỳ vào bệ chốt, tự kéo những khối còn lại vào hai nhóm theo thứ tự tùy ý. Có thể đổi chốt, kéo lại về kho, chuyển nhóm và hoàn tác. Sau khi chia hết các khối, bấm Kiểm tra để kiểm tra hai nhóm và cố định chốt. Chốt đúng vị trí chuyển vàng; mảng con trở thành đảo mới để tự chọn nhánh làm trước. Nhóm có một số tự hoàn thành.
- Demo dùng Lomuto với số cuối làm chốt. Play cho thử bất kỳ chốt nào, phân nhóm trực tiếp rồi ghép lại; số nhỏ hơn hoặc bằng chốt đứng trước và số lớn hơn đứng sau.
- **Dễ:** 5 số, không giới hạn giờ. **Vừa:** 7 số, không giới hạn giờ. **Khó:** 8 số có trùng lặp, 60 giây mỗi đảo. Mảng riêng nhận từ 2 đến 8 số ở mọi cấp.
- Bắt đầu với 1.000 điểm. Mỗi khối mới cố định được cộng 100 điểm, chia cân bằng thưởng 50 điểm. Chốt sai nhóm hoặc hết giờ trừ 50 điểm, giữ mảng để tự sửa. Gợi ý trừ 50 điểm một lần mỗi đảo; Buta chỉ xuất hiện khi được gọi và đồng hồ tạm dừng. Kỷ lục lưu riêng từng cấp bằng localStorage.
- **Bánh răng:** đổi cấp độ, âm thanh, cách chơi, nhập mảng riêng (số nguyên −99…99), chơi lại. Đổi mảng/cấp/chế độ bắt đầu lượt mới. Sau khi thắng có thể chơi lại mảng hiện tại, tăng độ khó với mảng mới hoặc chọn thuật toán khác trên bản đồ.
- Play có nút về bản đồ, bánh răng, hoàn tác và gợi ý. Pointer Events hỗ trợ chuột và cảm ứng, có khối nổi theo tay, vùng nhận sáng và hiệu ứng tiếp đất. Bàn phím dùng Enter để nhấc khối rồi chọn vùng nhận. Giữ khối gần mép màn hình để bàn chơi tự cuộn.
- Cài đặt, hướng dẫn, hộp nhập mảng, rời màn chơi và ẩn tab đều tạm dừng bộ đếm. Hiệu ứng âm thanh bật mặc định, chỉ phát sau thao tác của người chơi; bật/tắt trong bánh răng hoặc trên bản đồ, lựa chọn được lưu trên thiết bị.

## Kiến trúc

- `src/components/GameHud.tsx` và `src/gameHud.css`: khung màn chơi, tiêu đề, sao/thẻ điểm và nút gợi ý dùng chung cho Bubble, Selection, Insertion và Quick Sort. Màn thuật toán mới dùng `GameLayout`, `GameHeader`, `GameStats` và `GameFooter` theo mẫu bên dưới. Footer là phần tử cùng cấp với bàn chơi, nằm ở cuối màn; không đặt nút gợi ý vào phần nội dung được căn giữa. Demo truyền `play={false}` cho layout/header và không truyền điểm. Giữ vị trí và kiểu dáng chung trong `gameHud.css` thay vì ghi đè ở CSS từng thuật toán. `tests/game-hud.spec.ts` đối chiếu vị trí, khoảng cách cuối màn, kiểu nút và mở/đóng gợi ý trên desktop, điện thoại dọc/ngang; bổ sung tên thuật toán mới vào danh sách kiểm tra này.

```tsx
<GameLayout className="algorithm-world">
  <GameHeader title="Tên thuật toán" onBack={onBack} onSettings={openSettings} />
  <GameStats score={score}><span>{moves} lượt</span></GameStats>
  <section className="algorithm-content">{/* Bàn chơi và thao tác; CSS flex: 1 */}</section>
  <GameFooter>
    {/* Lời gợi ý nổi phía trên footer, không làm dịch chuyển bàn chơi */}
    <GameHintButton aria-expanded={hint} onClick={toggleHint} />
  </GameFooter>
</GameLayout>
```

- `src/engine/quicksort.ts`: engine TypeScript thuần, snapshot trạng thái trước từng thao tác; validator độc lập UI. Mỗi phần tử có ID riêng để diễn hoạt và xử lý số trùng chính xác. Có thể tái sử dụng trên mobile.
- `src/App.tsx`: quản lý màn bản đồ, màn chơi và các hộp tùy chọn.
- `src/engine/expedition.ts`: luật phân hoạch tự do, cho phép chọn chốt, thứ tự kéo và thứ tự nhánh; bảo toàn danh tính số trùng.
- `src/engine/lesson.ts`: timeline sư phạm thuần TypeScript, dùng snapshot từ cùng engine Lomuto. Phân biệt quan sát, quyết định, trước/sau đổi chỗ, cố định chốt và đệ quy.
- `src/components/DemoLesson.tsx`: màn bài học, trình phát và lời giải thích riêng cho demo.
- `src/components/LessonBoard.tsx`: các nhóm màu, con trỏ có tên, mũi tên và chuyển động đổi chỗ theo cung; animation có thể tạm dừng.
- Khung xanh đánh dấu ô nhận số nhỏ, mũi tên tím đánh dấu số đang xét. Lời Buta giải thích riêng khi số > chốt đứng nguyên, số ≤ chốt ở cùng ô (không tự đổi), khác ô (cần đổi), và lúc đặt chốt. Chỉ số ô khớp với khung đánh dấu.
- `src/audio/gameAudio.ts`, `src/audio/lessonSound.ts`: hiệu ứng Web Audio tự tổng hợp cho chọn chốt, xét số, giữ nguyên, đổi chỗ, tiếp đất, chia mảng và hoàn thành. Âm thanh đổi chỗ/tiếp đất đồng bộ với chuyển động; tạm dừng, mở cài đặt, rời tab hoặc tắt tiếng sẽ hủy cả âm đã lên lịch.
- `src/components/AdventureMap.tsx`: lộ trình các bài trong từng chủ đề, bảng hành động và Buta di chuyển theo đường cong qua từng đảo trung gian.
- Bản đồ cuộn dọc bằng chuột hoặc cảm ứng, tự theo Buta khi đang di chuyển. Chọn đảo bị khóa chỉ hiển thị điều kiện mở; Buta ở nguyên vị trí. Bàn phím tự cuộn tới đảo được focus.
- `src/track.css`: bố cục bản đồ thích ứng, bảng đáy trên điện thoại dọc, bảng bên cạnh trên điện thoại ngang và hoạt ảnh bước chân.
- `src/components/World.tsx`: khung cảnh đồng cỏ, cây và mây bằng SVG/CSS.
- `src/components/ExpeditionPlay.tsx`: sân chơi kéo thả, đảo mảng con, hoàn tác, điểm thưởng, đồng hồ và gợi ý theo yêu cầu.
- `src/components/Pig.tsx`, `src/mascot.css`: rig SVG với đầu, mắt, miệng, tai, tay và thân chuyển động riêng; 8 biểu cảm vui, suy nghĩ, động viên, ăn mừng, chỉ dẫn, giải thích, ngạc nhiên và tự hào. Biểu cảm theo ngữ cảnh bài học.
- `src/styles.css`: bố cục thích ứng desktop, điện thoại dọc/ngang; mảng dài cuộn ngang; hỗ trợ giảm chuyển động.
- `src/expedition.css`: khối kho báu, bệ chốt, vùng chia nhóm, đảo mảng con và bố cục thích ứng.
- `src/engine/quicksort.test.ts`: kiểm tra trạng thái, phân hoạch, số trùng, mảng âm, input bất biến và generator.
- `src/engine/lesson.test.ts`: kiểm tra snapshot, giá trị từng nhóm, chốt cố định, thứ tự các nhịp dạy và mảng con đệ quy.
- `tests/lesson.spec.ts`: kiểm tra chữ lớn trên laptop, quan hệ so sánh, animation đổi chỗ/tạm dừng, biểu cảm theo ngữ cảnh và bố cục bài học.
- `tests/game.spec.ts`: kiểm tra bản đồ và trình phát demo.
- `tests/expedition.spec.ts`: kiểm tra kéo thả chuột, cảm ứng, bàn phím, tự sửa nhóm, chọn nhánh, chơi hết màn, đồng hồ và bố cục.

## Kiểm tra và build

```sh
npm test
npm run build
npm run test:e2e
```

E2E mặc định dùng Chrome đã cài trên máy. Nếu có Edge, dùng PowerShell: `$env:PLAYWRIGHT_CHANNEL='msedge'; npm run test:e2e`. Có thể cài Chrome bằng `npx playwright install chrome`. Các bài kiểm tra gameplay dùng fixture tiến trình đã hoàn thành những ải đứng trước, không bỏ qua khóa trong ứng dụng. `tests/world-map.spec.ts` kiểm tra vuốt trái/phải, kéo chuột, bàn phím, bấm bản đồ vào lộ trình, lưu tiến trình và điều kiện hoàn thành toàn bộ chủ đề trước.

`npm run build` tạo web tĩnh trong `dist/`. Chạy `npm run preview` để xem bản build. Font Google được tải qua mạng; có font sans-serif dự phòng nếu offline. Game không dùng tài khoản hay dịch vụ backend; chưa có service worker/PWA.
# AlgoVenture_Game

Linked List hiện dùng một bài dài nhất mỗi nốt: Construction 4 nút, Traversal tới nút cuối, Search tìm vị trí, Insertion chèn giữa, Deletion xóa giữa, Reversal 4 nút. Demo có phát/tạm dừng, bước trước/sau và tốc độ 1x/1.5x/2x. Đinh màu có rãnh chữ thập; dây rời đứng yên; kéo đinh để đổi liên kết.
