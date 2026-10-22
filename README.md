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
- **Play – Đường đua bong bóng:** chọn một trong hai bong bóng của cặp đang sáng và kéo sang bong bóng còn lại. Khi số trái lớn hơn số phải, có thể kéo số trái sang phải hoặc số phải sang trái để đổi chỗ. Khi cặp đã đúng thứ tự hoặc hai số bằng nhau, phải bấm Giữ nguyên; kéo bong bóng bên phải không chuyển sang cặp kế tiếp. Giữ tay để đi qua nhiều ô trong một lần kéo; khi gặp hàng xóm lớn hơn hoặc bằng, thả tay và bấm Giữ nguyên trước khi xét cặp kế tiếp. Nút Giữ nguyên luôn hiện dưới mảng khi xét một cặp: bấm khi số trái nhỏ hơn hoặc bằng số phải để chuyển sang cặp kế tiếp. Bấm sai giữ nguyên trạng thái và giải thích để thử lại. Kéo liên tiếp chỉ tiếp tục qua các cặp cần đổi chỗ. Bàn phím dùng Tab chọn một trong hai bong bóng rồi nhấn phím mũi tên trái/phải hoặc Enter để đổi chỗ. Cuối mỗi lượt, số lớn nhất chuyển xanh tại đích; lượt sau quay về đầu, phần cần xét ngắn hơn.
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

- **Xếp thẻ cùng Buta:** thẻ chưa xét úp trong chồng bên trái, thẻ đang cầm ở giữa, bộ thẻ đã xếp xòe nhẹ phía dưới. Mỗi thẻ có ký hiệu và màu riêng theo ID, giúp phân biệt các thẻ cùng số.
- **Thử thách:** kéo thẻ trên cùng vào khung giữa bàn để rút; xét bộ thẻ từ phải sang trái, kéo thẻ lớn hơn vào khe trống để nhường chỗ; kéo thẻ đang cầm xuống khe khi đã tìm được vị trí. Có thể bấm/chạm thẻ hoặc dùng Enter/Space thay cho kéo. Chèn sớm hoặc dịch sai giữ nguyên bộ bài và trừ 25 điểm; mỗi bước đúng cộng 100 điểm. Thả hụt/hủy kéo giữ nguyên điểm và trạng thái.
- **Dễ:** 5 thẻ, có viền chỉ thao tác và bước hiện tại. **Vừa:** 6 thẻ, tự suy luận; gợi ý chỉ hiện khi gọi Buta. **Khó:** 6 thẻ có số âm và số trùng, không giới hạn thời gian. Hai thẻ cùng số phải giữ thứ tự ký hiệu; dịch qua thẻ bằng nhau bị từ chối và có giải thích.
- **Demo:** dùng cùng bàn thẻ và luật rút/dịch/chèn; có bước trước/sau, phát/tạm dừng, tốc độ 1x/1.5x/2x, mảng riêng 2–6 số nguyên −99…99. Xem Demo không ghi hoàn thành. Thẻ chuyển giữa chồng bài, khung cầm và bộ bài; tạm dừng dừng cả chuyển động. Bố cục vừa điện thoại dọc/ngang, không cần vuốt ngang.
- Bubble, Selection, Insertion và Quick có âm thanh cùng rung ngắn khi thao tác, thử sai và hoàn thành. Rung bật/tắt độc lập với âm thanh, lưu trên thiết bị trong `algoventure-haptics`; Demo chỉ phát âm thanh. Vibration API chỉ hoạt động trên thiết bị/trình duyệt hỗ trợ; không có phần cứng rung vẫn chơi bình thường. Rời màn, mở cài đặt hoặc ẩn tab dừng rung và âm thanh đang phát.
- Riêng Insertion Sort dùng tối đa 6 số: Dễ có 5 số, Vừa/Khó có 6 số; mức Khó có số âm và số trùng. Demo và Thử thách tự co giãn đủ dãy trên điện thoại, không cần vuốt ngang. Khung lời hướng dẫn và điều khiển Demo được căn gọn trên màn dọc/ngang.
- Logic thuần ở `src/engine/insertionSort.ts`; giao diện và chuyển động ở `src/components/InsertionGame.tsx`, `src/components/InsertionCardTable.tsx` / `src/insertion.css`; phản hồi dùng chung ở `src/audio/gameFeedback.ts`.
- Bản đồ có tiếng lướt trái/phải khi đổi chủ đề bằng vuốt, kéo chuột, mũi tên hoặc bàn phím; chọn đảo có tiếng riêng, đảo khóa có tiếng báo nhẹ. Bước chân trái/phải chạy theo nhịp Buta 240 ms và dừng khi đến nơi hoặc rời màn; đến đảo/chủ đề mới có một đoạn nhạc ngắn. Nút mở/đóng bảng và nút bấm thường có tiếng riêng, tránh phát chồng với âm thanh thao tác thuật toán. Nút bật tiếng có âm xác nhận; toàn bộ âm thanh này dùng chung cài đặt âm thanh hiện có, không có nhạc tự phát khi mới tải trang.

Bubble Sort Play bỏ chú thích màu dưới mảng. Bubble Sort Demo dùng nền sáng như Quick Sort Demo và các bong bóng tròn.

## Merge Sort – Suối Hợp Nhất

- **Chia:** tách nhóm lá sen thành hai phần liên tiếp, giữ nguyên thứ tự. Kéo giọt nước Tách nhánh sang một bờ hoặc bấm/chạm nút. Có thể chọn nhóm khác trên sơ đồ nhánh nhỏ. Chỉ bắt đầu ghép khi mỗi nhóm còn một lá.
- **Ghép:** hai nhánh suối đưa ra lá đầu; kéo lá nhỏ hơn xuống hồ hoặc chạm/Enter/Space để chọn. Chỉ lấy đầu nhánh. Khi bằng nhau, lấy nhánh trái trước để giữ thứ tự hoa và ID. Một nhánh hết thì vẫn tự đưa từng lá còn lại xuống hồ, không tự chạy.
- Ghép đủ một nhóm, bấm Ghép nhánh tiếp theo. Nhóm vừa có thứ tự được dùng cho lần ghép lớn hơn. Hoàn tất dòng suối mới ghi nhận hoàn thành bài và mở Quick Sort.
- Không có đồng hồ, cần gạt hay thất bại kết thúc lượt. Chọn sai giữ nguyên lá để sửa, trừ 25 điểm; chia đúng cộng 50 điểm, đưa đúng một lá cộng 100 điểm. Thả hụt/hủy kéo không trừ điểm. Sao thưởng dựa trên số lần thử sai.
- Thử thách ở mọi mức không highlight lá cần chọn, kể cả khi mở gợi ý; người chơi tự so sánh. Demo vẫn minh họa lá được chọn. Khó có số âm và số trùng. Dễ/Vừa/Khó có 5/7/8 lá, mảng riêng 2–8 số nguyên −99…99. Bàn chơi chỉ tập trung hai nhóm hiện tại, hồ kết quả chia hàng, không vuốt ngang. Buta ngồi bên bờ, hoa trên lá giúp phân biệt các số trùng.
- **Demo:** cùng giao diện lá sen và luật Merge Sort, có bước trước/sau, phát/tạm dừng, tốc độ 1x/1.5x/2x. Tạm dừng/cài đặt/ẩn tab dừng chuyển động lá. Demo không ghi hoàn thành. Giao diện dùng SVG/CSS, không tải ảnh nhà máy.
- `src/engine/mergeStream.ts`: luật chơi chủ động; `mergeSort.ts`: engine Merge Sort và timeline dùng chung. Giao diện: `src/components/MergeGame.tsx`, `MergeStreamBoard.tsx`, `src/merge.css`. Kiểm chứng: `src/engine/mergeStream.test.ts`, `tests/merge.spec.ts`, [biên bản kiểm tra](docs/merge-sort-qa.md).

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
