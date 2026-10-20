# REPORT ĐỀ XUẤT - GAME HỌC THUẬT TOÁN ĐỒ THỊ

## 1. TÓM TẮT PROJECT HIỆN TẠI

### 1.1. Công nghệ và kiến trúc
- **Framework:** React 19.2.0 với TypeScript
- **Build tool:** Vite 6.4.0
- **Testing:** Vitest (unit tests) + Playwright (E2E tests)
- **UI library:** Lucide React (icons)
- **Dependencies:** Chỉ có React, React DOM, Lucide React - không có framework UI nặng
- **State management:** React hooks (useState, useEffect, useRef, useLayoutEffect)
- **Audio:** Web Audio API với synth tự tổng hợp (không dùng file audio)
- **Storage:** localStorage để lưu tiến trình (`algoventure.world-progress.v3`)

### 1.2. Các chức năng thực tế đã có
**Hoàn chỉnh và có thể chơi:**
- **Bubble Sort:** Demo + Play với gameplay "Đường đua bong bóng"
- **Selection Sort:** Demo + Play với gameplay tìm số nhỏ nhất
- **Insertion Sort:** Demo + Play với gameplay kéo thả chèn
- **Quick Sort:** Demo + Play với gameplay "Chia kho báu" (ExpeditionPlay)

**Chỉ có bản đồ và placeholder:**
- **Mảng:** Merge Sort (đang phát triển, chưa có nội dung)
- **Danh sách:** Linked List, Stack, Queue (chỉ có bản đồ, chưa có nội dung)
- **Cây:** Cây cơ bản, BST, tìm kiếm/thêm/xóa BST (chỉ có bản đồ, chưa có nội dung)
- **Đồ thị:** Đồ thị cơ bản, DFS, BFS, Dijkstra (chỉ có bản đồ, chưa có nội dung)

**Hệ thống chung hoạt động tốt:**
- WorldMap: Bản đồ 4 vùng với chuyển động, vuốt trái/phải, animation Buta đi lại
- AdventureMap: Bản đồ lộ trình trong từng vùng với Buta di chuyển theo đường chữ S
- LearningTrack: Luật mở khóa, lưu tiến trình, điều kiện hoàn thành
- Nhân vật heo Buta: 8 biểu cảm (happy, thinking, oops, celebrate, pointing, explaining, surprised, proud)
- GameLayout/GameHeader/GameStats/GameFooter: Component chung cho màn chơi
- VictoryCelebration: Màn ăn mừng với sao thưởng
- Hệ thống âm thanh: gameAudio, lessonSound, gameFeedback với haptic
- Hệ thống demo: DemoLesson với timeline sư phạm (LessonBoard)
- Cài đặt: Modal tùy chọn âm thanh, rung, độ khó, nhập mảng riêng

### 1.3. Các thành phần có thể tái sử dụng
**Component UI:**
- `GameLayout`, `GameHeader`, `GameStats`, `GameFooter`, `GameHintButton` - có thể dùng cho mọi game
- `VictoryCelebration` - màn ăn mừng chung
- `Pig` - nhân vật heo với 8 biểu cảm
- `World` - background cảnh đồng cỏ
- `DemoLesson` - màn demo chung (có thể cần customize cho Graph)
- `LessonBoard` - bảng hiển thị thuật toán trong demo (có thể cần tùy chỉnh cho Graph)

**Engine:**
- Hệ thống timeline/step từ `quicksort.ts` và `lesson.ts` có thể tham khảo pattern
- Pattern validator độc lập UI có thể tái sử dụng
- `createArray()` tạo mảng ngẫu nhiên có thể tham khảo để tạo graph ngẫu nhiên

**Audio:**
- `gameAudio` - hiệu ứng âm thanh chung (tap, swap, finish, hint, retry...)
- `lessonSound` - âm thanh cho demo
- `gameFeedback` - phản hồi âm thanh/haptic cho thao tác

**CSS:**
- `styles.css` - global styles, layout chung
- `gameHud.css` - styles cho GameLayout components
- Pattern responsive desktop/mobile/tablet đã có

### 1.4. Những hạn chế và vấn đề phát hiện được
**Về Graph Algorithms:**
- **KHÔNG CÓ engine nào cho graph algorithms** - chỉ có placeholder trong learningTrack.ts
- **KHÔNG CÓ component nào cho graph gameplay** - không có GraphGame, không có GraphBoard
- `lessonAvailable()` chỉ trả về true cho bubble, selection, insertion, quick - các bài khác bị khóa
- Không có dữ liệu graph mẫu, không có generator graph
- Không có visualizer cho vertices/edges
- Không có logic kiểm tra thao tác người chơi trên graph

**Về kiến trúc:**
- Các engine hiện tại (bubbleSort, selectionSort, insertionSort, quicksort) chỉ làm việc với array, không có abstraction cho graph
- LessonBoard hiện tại được thiết kế riêng cho Quick Sort (có groups, pivot, arrows) - cần component mới cho Graph
- DemoLesson hiện tại dựa trên LessonFrame của Quick Sort - cần loại mới cho Graph

**Về mobile:**
- Các game hiện tại đã hỗ trợ mobile (touch, responsive)
- Nhưng Graph có đặc thù khác: cần đủ lớn để thấy vertices/edges, cần zoom/pan nếu graph lớn
- Kéo thả trên graph có thể phức tạp hơn trên mobile

### 1.5. Các lệnh cần chạy để kiểm tra project
```bash
npm install          # Cài đặt dependencies
npm run dev          # Chạy dev server (mặc định http://127.0.0.1:5173)
npm test            # Chạy unit tests (Vitest)
npm run test:e2e    # Chạy E2E tests (Playwright)
npm run build       # Build production
npm run preview     # Preview bản build
```

---

## 2. KẾT QUẢ PHÂN TÍCH GRAPH ALGORITHMS

### 2.1. Nội dung Graph tìm thấy trong source code
**Trong `src/engine/learningTrack.ts`:**
```typescript
export const GRAPH: Lesson[] = [
  { id: "graph-basics", name: "Đồ thị cơ bản", place: "Bản Đồ Những Cây Cầu", 
    description: "Làm quen với đỉnh, cạnh và cách biểu diễn các kết nối trong đồ thị.", 
    color: "#a5b8c8", dark: "#778da2" },
  { id: "dfs", name: "DFS", place: "Hẻm Núi Chiều Sâu", 
    description: "Đi sâu theo một nhánh trước khi quay lại khám phá nhánh khác.", 
    color: "#b4a1ce", dark: "#8673a2" },
  { id: "bfs", name: "BFS", place: "Những Vòng Đồi", 
    description: "Khám phá từng lớp các đỉnh gần Buta trước.", 
    color: "#98b7ce", dark: "#6a8ba4" },
  { id: "dijkstra", name: "Dijkstra", place: "Đỉnh Đường Ngắn Nhất", 
    description: "Tìm đường ngắn nhất trên đồ thị có trọng số không âm.", 
    color: "#d9ac88", dark: "#b08261" },
];
```

**Trong `src/components/AdventureMap.tsx`:**
- Đã có icon mapping: `"graph-basics": Network, dfs: Route, bfs: Network, dijkstra: Flag`
- Đã có UI cho 4 bài học trên bản đồ lộ trình

**KẾT LUẬN:** 
- Graph đã được **kế hoạch** trong learning track
- Nhưng **KHÔNG CÓ IMPLEMENTATION** - chỉ là metadata trên bản đồ
- Không có engine, không có component, không có dữ liệu graph

### 2.2. Những thuật toán đã được triển khai
**TRONG SOURCE CODE HIỆN TẠI:**
- KHÔNG CÓ thuật toán Graph nào được triển khai
- Chỉ có thuật toán Sorting: Bubble, Selection, Insertion, Quick

### 2.3. Những thuật toán mới được đề xuất
Dựa trên nghiên cứu và phù hợp với scope project:

**ĐỀ XUẤT CHÍNH - BFS (Breadth-First Search):**
- **Mục tiêu:** Tìm đường đi ngắn nhất trên đồ thị không có trọng số
- **Kiến thức cần hiểu:**
  - Đỉnh (vertex/node), cạnh (edge), đồ thị vô hướng/có hướng
  - Hàng đợi (queue) - FIFO
  - Khái niệm "lớp" (layer) - đỉnh cách start 1 bước, 2 bước, 3 bước...
  - Đánh dấu đã thăm (visited) để tránh vòng lặp vô hạn
  - Thuật toán mở rộng từng lớp từ điểm bắt đầu
- **Các bước chính:**
  1. Bắt đầu từ đỉnh start, đánh dấu visited
  2. Thêm start vào queue
  3. Lấy đỉnh ra khỏi queue (dequeue)
  4. Với mỗi neighbor chưa visited: đánh dấu visited, thêm vào queue
  5. Lặp lại cho đến khi queue rỗng hoặc tìm thấy goal
- **Điều kiện áp dụng:** Đồ thị không có trọng số, muốn tìm đường ngắn nhất
- **Cách biểu diễn trạng thái trực quan:**
  - Dùng màu: xanh = đã thăm, vàng = đang xét, xám = chưa thăm
  - Dùng số: gán số thứ tự layer (1, 2, 3...) lên mỗi đỉnh
  - Dùng animation: lan ra từng vòng tròn từ điểm bắt đầu
- **Khả năng thiết kế thành gameplay:** CAO - người chơi có thể điều khiển việc lấy đỉnh từ queue và thêm neighbor vào queue
- **Độ phức tạp tích hợp:** TRUNG BÌNH - cần engine graph mới, component visualizer graph mới, nhưng có thể tái sử dụng nhiều component chung

**KHÔNG LÀM TRONG MVP NHƯNG CÓ THỂ XÉT SAU:**
- **DFS (Depth-First Search):** Đi sâu vào nhánh, dùng stack, không đảm bảo đường ngắn nhất
- **Graph Basics:** Khái niệm đỉnh/cạnh, adjacency list vs adjacency matrix - có thể gộp vào tutorial của BFS
- **Dijkstra:** Tính phức tạp cao hơn (trọng số, priority queue), nên để sau khi BFS hoàn thiện

### 2.4. Nguồn tài liệu tham khảo
- **VisuAlgo:** https://visualgo.net/en/dfsbfs - Visualization DFS/BFS
- **Maze pathfinding - BFS, DFS and A* (Simulic):** https://simulic.com/en/computer-science/maze-pathfinding-bfs-dfs-and-a-KCcTaqoKwqMg/ - BFS trên grid
- **BFS Visualizer (Zerethon):** https://tools.zerethon.com/breadth-first-search-visualizer - Interactive BFS
- **CS106B Graph Algorithms (Stanford):** https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1244/lectures/24-graphs/ - Lecture notes
- **Graph Theory & Networks Lab:** https://livephysics.com/labs/graph-theory-lab/ - Interactive graph builder

---

## 3. PHẠM VI MVP ĐỀ XUẤT

### 3.1. Thuật toán được chọn
**BFS (Breadth-First Search)** - Tìm đường đi ngắn nhất trên đồ thị không có trọng số

### 3.2. Lý do lựa chọn
**Phù hợp với source code hiện tại:**
- BFS có pattern tương đồng với Quick Sort: đều là "chia nhỏ, xử lý từng phần"
- Có thể tái sử dụng pattern timeline/step từ `quicksort.ts` và `lesson.ts`
- Có thể tái sử dụng GameLayout, GameHeader, GameStats, GameFooter
- Có thể tái sử dụng VictoryCelebration, Pig, hệ thống âm thanh
- AdventureMap đã có sẵn slot cho BFS với icon và màu sắc

**Giá trị học tập:**
- BFS là thuật toán nền tảng trong graph theory
- Dễ hiểu: mở rộng từng vòng tròn từ điểm bắt đầu
- Có ứng dụng thực tế: tìm đường ngắn nhất trong mạng xã hội, GPS (không có traffic), crawling web
- Chuẩn bị cho Dijkstra sau này (nếu muốn phát triển tiếp)

**Khả năng tạo gameplay tương tác:**
- Có thể thiết kế gameplay: người chơi điều khiển queue, chọn neighbor để thêm vào queue
- Có thể cho người chơi thao tác từng bước: dequeue, examine neighbors, enqueue
- Visual dễ hiểu: màu sắc, số thứ tự layer, animation lan ra
- Có thể tạo thử thách: đồ thị lớn, nhiều nhánh, cần chiến lược

**Khả năng hoàn thành và kiểm thử:**
- Scope vừa đủ: 1 thuật toán, 1 game hoàn chỉnh
- Engine graph tương đối đơn giản (đỉnh, cạnh, adjacency list)
- Component visualizer cần thiết nhưng không quá phức tạp
- Có thể viết unit tests cho engine graph
- Có thể viết E2E tests cho gameplay
- Mobile feasible: đồ thị có thể scale, cần pan/zoom nếu lớn

### 3.3. Các tính năng bắt buộc
**Engine Graph (TypeScript thuần):**
- Biểu diễn graph: vertices, edges, adjacency list
- Engine BFS thuần với timeline states (tương tự quicksort.ts)
- Validator để kiểm tra thao tác người chơi
- Generator để tạo graph ngẫu nhiên với các mức độ khó

**Component UI:**
- `GraphGame` - màn chơi chính với GameLayout
- `GraphBoard` - visualizer graph với vertices, edges, animation
- `GraphLesson` (hoặc customize DemoLesson) - màn demo BFS
- Tích hợp với AdventureMap và learningTrack

**Gameplay:**
- Game hoàn chỉnh với vòng chơi: start → play → win → celebration
- Ít nhất 3 màn chơi với độ khó tăng dần
- Có gợi ý (hint) từ Buta
- Có tính điểm, đánh giá sao
- Có thể chơi lại, tăng độ khó

**Demo:**
- Demo BFS chạy tự động với timeline sư phạm
- Giải thích từng bước: start, enqueue, dequeue, examine neighbors, mark visited
- Lời Buta theo ngữ cảnh

**Mobile:**
- Responsive layout cho desktop, tablet, mobile
- Đủ lớn để tap vào vertices trên mobile
- Không phụ thuộc hover
- Có thể hoàn thành toàn bộ màn chơi trên mobile

### 3.4. Những tính năng chủ động không làm để tránh vượt phạm vi
**KHÔNG LÀM:**
- DFS - để sau khi BFS hoàn thiện
- Dijkstra - quá phức tạp cho MVP
- Graph Basics riêng - gộp vào tutorial của BFS
- Multiplayer, leaderboard - ngoài phạm vi giáo dục
- Graph editor/creator - chỉ dùng generator với các preset
- Multiple graph types (directed, weighted) - chỉ tập trung undirected unweighted cho MVP
- Advanced graph algorithms (Kruskal, Prim, Topological Sort) - để sau

---

## 4. THIẾT KẾ GAMEPLAY

### 4.1. Mục tiêu học tập
Người chơi sẽ hiểu:
- Graph là gì (đỉnh, cạnh, kết nối)
- BFS hoạt động như thế nào (mở rộng từng lớp từ điểm bắt đầu)
- Tại sao BFS tìm được đường ngắn nhất trên đồ thị không có trọng số
- Cách sử dụng queue trong BFS
- Cách đánh dấu visited để tránh vòng lặp

### 4.2. Luật chơi
**Bối cảnh:** Buta đang ở một đỉnh (start) và cần đến đỉnh đích (goal) thông qua các cây cầu (edges). Người chơi sẽ dùng BFS để tìm đường đi ngắn nhất.

**Cơ chế gameplay:**
- Buta bắt đầu ở đỉnh start (đánh dấu màu vàng)
- Queue hiển thị các đỉnh đang chờ được xét
- Người chơi thao tác từng bước:
  1. **Dequeue:** Lấy đỉnh đầu queue ra để xét
  2. **Examine:** Xem các neighbor của đỉnh đó
  3. **Enqueue:** Thêm neighbor chưa visited vào queue
  4. **Mark visited:** Đánh dấu đỉnh đã xét
- Khi đến đỉnh goal, game kết thúc

**Kiểm tra tính đúng đắn:**
- Engine BFS có timeline states "đúng"
- Validator so sánh thao tác người chơi với timeline
- Nếu người chơi dequeue sai đỉnh → phản hồi sai
- Nếu người chơi enqueue neighbor không hợp lệ → phản hồi sai
- Nếu người chơi bỏ qua neighbor nên enqueue → gợi ý

**Cơ chế xử lý lỗi và gợi ý:**
- Sai: hiển thị message giải thích, trừ điểm, cho thử lại
- Gợi ý: Buta hiện lên với lời thoại ngắn, chỉ ra đỉnh nên thao tác tiếp theo
- Có thể hoàn tác (undo) 1-2 bước gần nhất
- Có thể reset màn chơi

**Điều kiện thắng:**
- Đến được đỉnh goal
- Đường đi tìm được là đường ngắn nhất (đảm bảo bởi BFS)
- Số lỗi/gợi ý dưới mức tối đa để đạt 3 sao

**Điều kiện kết thúc:**
- Thắng: đến goal → celebration → có thể chơi lại hoặc tăng độ khó
- Hết lượt (nếu có giới hạn lượt ở mode khó) → thua → chơi lại

**Đánh giá người chơi:**
- Điểm: mỗi bước đúng cộng điểm, sai trừ điểm
- Sao: dựa trên số lỗi + số gợi ý
- 3 sao: 0 lỗi, 0 gợi ý
- 2 sao: ≤ 3 lỗi + gợi ý
- 1 sao: > 3 lỗi + gợi ý

**Cách độ khó tăng lên:**
- **Dễ:** 5-6 đỉnh, đồ thị đơn giản, không giới hạn lượt
- **Vừa:** 7-8 đỉnh, nhiều nhánh, không giới hạn lượt
- **Khó:** 8-10 đỉnh, đồ thị phức tạp, giới hạn lượt hoặc thời gian

### 4.3. Các hành động của người chơi
**Click vào đỉnh:**
- Nếu đỉnh ở đầu queue → dequeue (xét đỉnh này)
- Nếu đỉnh là neighbor của đỉnh đang xét → enqueue (thêm vào queue)
- Nếu đỉnh không hợp lệ → không làm gì, có thể feedback nhỏ

**Nút bấm (tùy chọn):**
- Nút "Dequeue": Lấy đỉnh đầu queue ra
- Nút "Enqueue": Thêm neighbor đã chọn vào queue
- Nút "Undo": Hoàn tác bước gần nhất
- Nút "Hint": Gọi Buta gợi ý
- Nút "Reset": Chơi lại từ đầu

**Kéo thả (tùy chọn):**
- Kéo neighbor vào vùng queue để enqueue
- Có thể không cần nếu click đủ rõ ràng

### 4.4. Cách kiểm tra tính đúng đắn
**Engine BFS:**
```typescript
type GraphState = {
  vertices: Vertex[];
  edges: Edge[];
  queue: number[]; // IDs of vertices in queue
  visited: Set<number>; // IDs of visited vertices
  current: number | null; // ID of vertex being examined
  goal: number; // ID of goal vertex
  path: number[]; // Current path found
};

type BFSStep = {
  state: GraphState;
  action: "START" | "DEQUEUE" | "ENQUEUE" | "VISIT" | "FOUND" | "DONE";
  message: string;
  expectedVertex?: number; // Vertex that should be acted on
  expectedNeighbors?: number[]; // Neighbors that should be enqueued
};
```

**Validator:**
- So sánh vertex người chơi dequeue với `expectedVertex`
- So sánh neighbors người chơi enqueue với `expectedNeighbors`
- Kiểm tra không enqueue neighbor đã visited
- Kiểm tra không dequeue khi queue rỗng

### 4.5. Cơ chế xử lý lỗi và gợi ý
**Lỗi:**
- **Dequeue sai:** "Đỉnh này chưa đến lượt. Hãy lấy đỉnh đầu queue nhé."
- **Enqueue sai:** "Đỉnh này không phải neighbor của đỉnh đang xét."
- **Enqueue đã visited:** "Đỉnh này đã thăm rồi, không cần thêm vào queue."
- **Bỏ qua neighbor:** "Còn neighbor chưa thăm. Hãy thêm vào queue nhé."

**Gợi ý:**
- Buta hiện lên với biểu cảm "thinking" hoặc "pointing"
- Lời thoại ngắn: "Hãy lấy đỉnh X ra khỏi queue" hoặc "Đỉnh Y là neighbor, hãy thêm vào queue"
- Gợi ý trừ 50 điểm (tương tự Quick Sort)

**Hoàn tác:**
- Lưu 2-3 state gần nhất
- Nút Undo khôi phục state trước đó
- Undo không phục hồi điểm

### 4.6. Điều kiện thắng và chơi lại
**Thắng:**
- Đến đỉnh goal
- Hiển thị VictoryCelebration với sao
- Nút "Chơi lại" (cùng graph)
- Nút "Tăng độ khó" (graph mới khó hơn)
- Nút "Đi tiếp cùng Buta" (về bản đồ)

**Chơi lại:**
- Reset state về ban đầu
- Giữ nguyên graph
- Reset điểm, sao

**Tăng độ khó:**
- Generate graph mới với độ khó cao hơn
- Reset tất cả

---

## 5. KỊCH BẢN TỪNG MÀN CHƠI

### 5.1. Màn 1: Hướng dẫn - "Nhập môn BFS"
**Tên màn:** Lần đầu gặp đồ thị

**Mục tiêu kiến thức:**
- Hiểu khái niệm đỉnh, cạnh, đồ thị
- Hiểu BFS mở rộng từng lớp từ điểm bắt đầu
- Làm quen với queue

**Graph:**
- 5 đỉnh: A (start), B, C, D, E (goal)
- Edges: A-B, A-C, B-D, C-E (đồ thị cây đơn giản)
- Start: A, Goal: E

**Nhiệm vụ cụ thể:**
- Buta bắt đầu ở A
- Người chơi cần dùng BFS để đến E
- Hướng dẫn từng bước: dequeue A, enqueue B và C, dequeue B, enqueue D, dequeue C, enqueue E (found!)

**Hành động người chơi:**
1. Click vào A (đỉnh đầu queue) → dequeue A
2. A được đánh dấu visited (màu xanh)
3. Nhìn thấy neighbors B và C (highlight)
4. Click vào B → enqueue B
5. Click vào C → enqueue C
6. Click vào B (đầu queue) → dequeue B
7. B được đánh dấu visited
8. Nhìn thấy neighbor D (highlight)
9. Click vào D → enqueue D
10. Click vào C (đầu queue) → dequeue C
11. C được đánh dấu visited
12. Nhìn thấy neighbor E (highlight, goal)
13. Click vào E → enqueue E
14. E được đánh dấu là goal → victory!

**Điều kiện hoàn thành:**
- Đến được E
- Số bước tối thiểu (tối ưu hóa BFS)

**Cách phản hồi khi sai:**
- Nếu dequeue sai: "Đỉnh này chưa đến lượt. Queue là FIFO, hãy lấy đỉnh đầu tiên."
- Nếu enqueue sai: "Đỉnh này không phải neighbor. Chỉ có B và C là neighbor của A."
- Nếu bỏ qua neighbor: "Còn neighbor chưa thêm vào queue. BFS cần xét tất cả neighbor."

**Kiến thức được kiểm tra:**
- Hiểu queue FIFO
- Hiểu neighbor là gì
- Hiểu visited mark

**Cách màn này chuẩn bị cho màn tiếp theo:**
- Giới thiệu cơ chế BFS cơ bản
- Chuẩn bị cho đồ thị phức tạp hơn với cycle

### 5.2. Màn 2: Thử thách - "BFS với Cycle"
**Tên màn:** Đường quanh co

**Mục tiêu kiến thức:**
- Hiểu xử lý cycle trong graph
- Hiểu tại sao cần đánh dấu visited
- BFS vẫn hoạt động với đồ thị có cycle

**Graph:**
- 6 đỉnh: A (start), B, C, D, E, F (goal)
- Edges: A-B, B-C, C-D, D-E, E-F, A-C (có cycle A-B-C-A)
- Start: A, Goal: F

**Nhiệm vụ cụ thể:**
- Buta bắt đầu ở A
- Người chơi cần đến F
- Có cycle A-B-C-A, cần tránh lặp vô hạn

**Hành động người chơi:**
1. Dequeue A → mark visited
2. Enqueue B, C (neighbors của A)
3. Dequeue B → mark visited
4. Enqueue C (neighbor của B) → NHƯNG C đã visited → feedback "C đã thăm"
5. Enqueue D (neighbor của C) → NHƯNG C chưa dequeue → feedback "Chỉ xét neighbor của đỉnh đang dequeue"
6. Dequeue C → mark visited
7. Enqueue D (neighbor của C)
8. Dequeue D → mark visited
9. Enqueue E (neighbor của D)
10. Dequeue E → mark visited
11. Enqueue F (neighbor của E, goal) → victory!

**Điều kiện hoàn thành:**
- Đến được F
- Không lặp vô hạn (nhờ visited mark)

**Cách phản hồi khi sai:**
- Nếu cố enqueue neighbor đã visited: "Đỉnh này đã thăm rồi. Đánh dấu visited giúp tránh lặp vô hạn."
- Nếu enqueue neighbor không phải của đỉnh đang dequeue: "Chỉ xét neighbor của đỉnh đang được dequeue."

**Kiến thức được kiểm tra:**
- Xử lý cycle
- Tầm quan trọng của visited mark
- Queue mechanics

**Cách màn này chuẩn bị cho màn tiếp theo:**
- Chuẩn bị cho đồ thị nhiều nhánh phức tạp hơn

### 5.3. Màn 3: Thử thách - "Đồ thị phức tạp"
**Tên màn:** Mê cung cây cầu

**Mục tiêu kiến thức:**
- BFS trên đồ thị nhiều nhánh
- Chọn đúng thứ tự dequeue để tối ưu
- Hiểu BFS luôn tìm đường ngắn nhất

**Graph:**
- 8 đỉnh: A (start), B, C, D, E, F, G, H (goal)
- Edges: A-B, A-C, B-D, B-E, C-F, C-G, D-H, F-H (đồ thị nhiều nhánh)
- Start: A, Goal: H

**Nhiệm vụ cụ thể:**
- Buta bắt đầu ở A
- Người chơi cần đến H
- Có 2 đường đến H: A-B-D-H và A-C-F-H
- BFS sẽ tìm đường ngắn nhất (cả 2 đều dài 3 cạnh)

**Hành động người chơi:**
1. Dequeue A → mark visited
2. Enqueue B, C
3. Dequeue B → mark visited
4. Enqueue D, E
5. Dequeue C → mark visited
6. Enqueue F, G
7. Dequeue D → mark visited
8. Enqueue H (neighbor, goal) → victory!

**Điều kiện hoàn thành:**
- Đến được H
- Có thể qua D hoặc F, đều đúng

**Cách phản hồi khi sai:**
- Nếu enqueue neighbor không hợp lệ: feedback như các màn trước
- Nếu dequeue sai thứ tự: feedback về queue FIFO

**Kiến thức được kiểm tra:**
- BFS trên đồ thị nhiều nhánh
- Đường ngắn nhất (cả 2 đường đều dài 3)

**Cách màn này chuẩn bị cho màn tiếp theo:**
- Chuẩn bị cho mode khó với giới hạn lượt

### 5.4. Màn 4 (Tùy chọn - Mode Khó): "Thử thách giới hạn lượt"
**Tên màn:** Cuộc đua với thời gian

**Mục tiêu kiến thức:**
- Tối ưu hóa BFS
- Chọn chiến lược dequeue/enqueue hiệu quả

**Graph:**
- 10 đỉnh, đồ thị phức tạp với nhiều nhánh
- Giới hạn lượt: 15 lượt

**Nhiệm vụ cụ thể:**
- Đến goal trong giới hạn lượt
- Cần chọn thứ tự dequeue hiệu quả

**Hành động người chơi:**
- Tương tự nhưng cần tính toán nhanh
- Có thể không cần enqueue tất cả neighbor nếu không cần thiết

**Điều kiện hoàn thành:**
- Đến goal trong 15 lượt
- Không quá nhiều lỗi

**Cách phản hồi khi sai:**
- Hết lượt → "Hết lượt rồi. Hãy thử lại với chiến lược khác."

**Kiến thức được kiểm tra:**
- Tối ưu BFS
- Chiến lược traversal

---

## 6. THIẾT KẾ TRẢI NGHIỆM MOBILE

### 6.1. Bố cục
**Desktop:**
- Graph ở giữa, đủ lớn để thấy tất cả vertices
- Queue ở bên trái hoặc bên phải
- Buta và lời thoại ở góc dưới
- Controls ở đáy hoặc cạnh

**Tablet:**
- Graph ở giữa, queue bên dưới hoặc trên
- Buta nhỏ hơn, lời thoại ngắn hơn

**Mobile (portrait):**
- Graph ở giữa, chiếm 60-70% màn hình
- Queue ở dưới Graph, dạng horizontal scroll
- Buta rất nhỏ hoặc chỉ hiện khi cần
- Controls ở đáy, nút đủ lớn

**Mobile (landscape):**
- Graph ở trái, queue ở phải
- Graph chiếm 60% width
- Queue vertical scroll
- Buta góc dưới trái

### 6.2. Điều khiển cảm ứng
**Tap vào đỉnh:**
- Region tap tối thiểu 44x44px (theo Apple guidelines)
- Hit area lớn hơn visual của đỉnh
- Feedback visual khi tap (highlight)

**Nút bấm:**
- Tối thiểu 48x48px
- Khoảng cách giữa nút ≥ 8px
- Easy to reach với ngón cái

**Kéo thả (nếu có):**
- Thay thế bằng tap → tap (chọn đỉnh → tap vùng queue)
- Hoặc drag and drop với visual feedback rõ ràng

**Pan/Zoom (nếu graph lớn):**
- Two-finger pan để di chuyển graph
- Pinch to zoom
- Nút reset view

### 6.3. Cách hiển thị Graph
**Đỉnh (Vertex):**
- Hình tròn, đường kính 40-50px trên mobile
- Màu: vàng = start, xanh = visited, xám = chưa thăm, đỏ = goal
- Label: A, B, C... đủ lớn để đọc (14-16px)
- Hit area lớn hơn visual 10-20px

**Cạnh (Edge):**
- Đường thẳng hoặc cong, độ dày 2-3px
- Màu: xám nhạt, highlight khi active
- Không cần tap, chỉ visual

**Queue:**
- Horizontal scroll trên mobile
- Mỗi item 50x50px
- Hiển thị ID và color của vertex

**Animation:**
- Lan ra từng vòng tròn từ start (vía BFS)
- Highlight neighbor khi dequeue
- Mark visited với animation màu

### 6.4. Các trường hợp cần xử lý riêng trên mobile
**Graph quá lớn:**
- Auto-scale để vừa màn hình
- Hoặc pan/zoom
- Ưu tiên hiển thị vùng đang active

**Queue dài:**
- Horizontal scroll
- Highlight item đầu queue
- Hiển thị "3/10" (số items)

**Buta và lời thoại:**
- Buta nhỏ hơn (scale 0.6-0.7)
- Lời thoại ngắn hơn (≤ 2 dòng)
- Có thể dismiss tap anywhere
- Không che Graph

**Landscape vs Portrait:**
- Responsive CSS với media queries
- Portrait: vertical layout
- Landscape: horizontal layout

**Thao tác nhỏ:**
- Min-tap-size 44x44px
- Không phụ thuộc hover
- Active state rõ ràng (tap feedback)

---

## 7. KẾ HOẠCH KỸ THUẬT

### 7.1. Các file dự kiến chỉnh sửa
**Engine:**
- `src/engine/graph.ts` (MỚI) - Engine graph thuần với BFS
- `src/engine/graph.test.ts` (MỚI) - Unit tests cho engine graph
- `src/engine/learningTrack.ts` - Thêm BFS vào `lessonAvailable()`
- `src/engine/gameConfig.ts` - Thêm "bfs" vào type Algorithm (nếu cần)

**Components:**
- `src/components/GraphGame.tsx` (MỚI) - Màn chơi chính BFS
- `src/components/GraphBoard.tsx` (MỚI) - Visualizer graph
- `src/components/GraphLesson.tsx` (MỚI) - Màn demo BFS (hoặc customize DemoLesson)
- `src/App.tsx` - Thêm route cho BFS
- `src/components/AdventureMap.tsx` - Có thể cần tweak icon/color nếu cần

**CSS:**
- `src/graph.css` (MỚI) - Styles riêng cho Graph
- `src/styles.css` - Có thể cần tweaks nhỏ cho Graph
- `src/gameHud.css` - Có thể cần tweaks

**Audio:**
- `src/audio/gameAudio.ts` - Thêm cues cho BFS (dequeue, enqueue, visit, found)
- `src/audio/lessonSound.ts` - Thêm cues cho demo BFS

**Tests:**
- `tests/graph.spec.ts` (MỚI) - E2E tests cho Graph
- `tests/game-hud.spec.ts` - Thêm tên BFS vào danh sách kiểm tra

### 7.2. Các component hoặc module dự kiến tạo mới
**Engine:**
- `src/engine/graph.ts` - Graph representation, BFS engine, timeline, validator
- `src/engine/graph.test.ts` - Unit tests

**Components:**
- `src/components/GraphGame.tsx` - Main game component
- `src/components/GraphBoard.tsx` - Graph visualizer (SVG hoặc Canvas)
- `src/components/GraphLesson.tsx` - Demo component (hoặc extend DemoLesson)

**CSS:**
- `src/graph.css` - Styles riêng

**Tests:**
- `tests/graph.spec.ts` - E2E tests

### 7.3. Các module hiện có sẽ tái sử dụng
**Components:**
- `GameLayout`, `GameHeader`, `GameStats`, `GameFooter`, `GameHintButton` - từ `GameHud.tsx`
- `VictoryCelebration` - màn ăn mừng
- `Pig` - nhân vật heo
- `World` - background
- `AdventureMap` - bản đồ lộ trình
- `WorldMap` - bản đồ thế giới

**Engine:**
- Pattern từ `quicksort.ts` (timeline, steps, validator)
- Pattern từ `lesson.ts` (pedagogical timeline)
- `createArray()` - tham khảo để tạo graph generator

**Audio:**
- `gameAudio` - hiệu ứng âm thanh chung
- `lessonSound` - âm thanh demo
- `gameFeedback` - phản hồi haptic

**Storage:**
- `readTrackProgress()`, `saveTrackProgress()` - lưu tiến trình

### 7.4. Những thay đổi có rủi ro cao
**Thay đổi `learningTrack.ts`:**
- Thêm BFS vào `lessonAvailable()` có thể ảnh hưởng logic mở khóa
- Cần test kỹ để đảm bảo không ảnh hưởng các bài học khác

**Tạo engine graph mới:**
- Cần đảm bảo pattern tương đồng với các engine hiện tại
- Cần unit tests đầy đủ

**Tạo GraphBoard visualizer:**
- SVG vs Canvas? SVG dễ hơn cho animation, Canvas tốt hơn cho performance lớn
- Cần đảm bảo responsive trên mobile
- Cần ensure không xung đột với CSS hiện tại

**Tích hợp với App.tsx:**
- Cần ensure route đúng, không ảnh hưởng các game khác
- Cần ensure state management đúng

### 7.5. Kế hoạch kiểm thử
**Unit Tests (Vitest):**
- Test engine graph: tạo graph, BFS algorithm, validator
- Test generator: tạo graph ngẫu nhiên với các mức độ
- Test edge cases: graph rỗng, graph 1 đỉnh, graph không có path

**E2E Tests (Playwright):**
- Test flow: vào bản đồ → chọn BFS → chơi demo → chơi game → thắng
- Test từng màn chơi
- Test mobile (viewport mobile)
- Test lỗi: dequeue sai, enqueue sai
- Test hint, undo, reset
- Test victory celebration

**Manual Testing:**
- Test trên desktop (Chrome, Firefox, Safari)
- Test trên tablet (iPad)
- Test trên mobile (iPhone, Android)
- Test responsive (portrait, landscape)
- Test accessibility (keyboard navigation, screen reader)

---

## 8. TIÊU CHÍ NGHIỆM THU

### 8.1. Điều kiện hoàn thành MVP
1. **Engine BFS hoạt động đúng:**
   - Unit tests pass (≥ 80% coverage)
   - BFS algorithm đúng với graph mẫu
   - Validator đúng với timeline

2. **Game có thể chơi từ đầu đến cuối:**
   - Ít nhất 3 màn chơi (hướng dẫn, thử thách cơ bản, thử thách nâng cao)
   - Có thể start → play → win → celebration
   - Có thể chơi lại, tăng độ khó

3. **Giao diện đầy đủ:**
   - Graph visualizer hoạt động (vertices, edges, animation)
   - Queue hiển thị đúng
   - Buta hiện lên với lời thoại phù hợp
   - Responsive trên desktop, tablet, mobile

4. **Tích hợp với kiến trúc hiện tại:**
   - Có thể vào từ bản đồ AdventureMap
   - Có thể mở khóa sau khi hoàn thành các bài trước (hoặc debug để mở)
   - Lưu tiến trình vào localStorage
   - VictoryCelebration hoạt động

5. **Demo hoạt động:**
   - Demo BFS chạy tự động
   - Timeline sư phạm có ý nghĩa
   - Lời Buta giải thích từng bước

6. **Tests:**
   - Unit tests pass
   - E2E tests pass (ít nhất flow chính)
   - Manual testing trên real devices

### 8.2. Điều kiện kiểm tra khách quan
- [ ] Engine graph: `npm test` pass với `graph.test.ts`
- [ ] BFS algorithm: Pass 5+ test cases khác nhau
- [ ] Game flow: Có thể complete ít nhất 1 màn chơi
- [ ] Mobile: Có thể complete màn chơi trên iPhone/Android real device
- [ ] Responsive: Không bị layout break trên các viewport
- [ ] Integration: Có thể vào BFS từ AdventureMap
- [ ] Progress: Hoàn thành BFS được lưu vào localStorage
- [ ] Demo: Demo BFS chạy từ đầu đến cuối
- [ ] Audio: Âm thanh phát khi thao tác
- [ ] Accessibility: Có thể navigate bằng keyboard

---

## 9. CÂU THOẠI NHÂN VẬT HEO

### 9.1. Bắt đầu game
**Màn hướng dẫn:**
- "Chào bạn! Mình là Buta. Hãy cùng mình tìm đường qua những cây cầu nhé!"
- "BFS sẽ giúp mình tìm đường ngắn nhất. Hãy bắt đầu từ đỉnh này."

**Màn thử thách:**
- "Đồ thị này phức tạp hơn một chút. Hãy dùng BFS để tìm đường nhé!"

### 9.2. Giải thích nhiệm vụ
**Màn hướng dẫn:**
- "Mình đang ở đỉnh A. Hãy lấy A ra khỏi queue để bắt đầu."
- "B và C là neighbor của A. Hãy thêm chúng vào queue."

**Màn thử thách:**
- "Cần cẩn thận, có thể có cycle. Đánh dấu visited sẽ giúp tránh lặp."

### 9.3. Phản hồi khi người chơi mắc lỗi
**Dequeue sai:**
- "Đỉnh này chưa đến lượt. Queue là FIFO, hãy lấy đỉnh đầu tiên nhé."

**Enqueue sai (không phải neighbor):**
- "Đỉnh này không phải neighbor. Chỉ có B và C kết nối với A."

**Enqueue đã visited:**
- "Đỉnh này đã thăm rồi. Đánh dấu visited giúp tránh lặp vô hạn."

**Bỏ qua neighbor:**
- "Còn neighbor chưa thêm vào queue. BFS cần xét tất cả neighbor cùng layer."

### 9.4. Gợi ý khi người chơi bị mắc kẹt
**Không biết dequeue nào:**
- "Hãy lấy đỉnh đầu queue ra. Đó là đỉnh màu vàng."

**Không biết enqueue nào:**
- "Những đỉnh màu sáng là neighbor. Hãy thêm chúng vào queue."

**Kẹt ở cycle:**
- "Kiểm tra xem đỉnh đã visited chưa. Nếu rồi thì bỏ qua."

### 9.5. Chúc mừng khi hoàn thành
**Màn hướng dẫn:**
- "Tuyệt vời! Bạn đã tìm được đường ngắn nhất. BFS mở rộng từng lớp, nên chắc chắn tìm được đường ngắn nhất."

**Màn thử thách:**
- "Xuất sắc! Bạn đã xử lý cycle rất tốt. Mình rất ngạc nhiên!"

**3 sao:**
- "Hoàn hảo! Không một lỗi nào. Bạn là bậc thầy BFS!"

**2 sao:**
- "Làm tốt lắm! Chỉ vài lỗi nhỏ. Cố gắng lên!"

**1 sao:**
- "Bạn đã hoàn thành! Hãy thử lại để đạt nhiều sao hơn."

---

## 10. PHẦN CẦN TÔI DUYỆT

### 10.1. Quyết định quan trọng cần xác nhận
1. **Thuật toán:** Có đồng ý chọn BFS làm thuật toán chính cho MVP không?
2. **Phạm vi:** Có đồng ý với phạm vi 3 màn chơi (hướng dẫn, thử thách cơ bản, thử thách nâng cao) không?
3. **Gameplay:** Có đồng ý với cơ chế gameplay "dequeue → examine neighbors → enqueue" không?
4. **Mobile:** Có đồng ý với yêu cầu responsive và playable trên mobile không?
5. **Timeline:** Sau khi duyệt, có cần điều chỉnh timeline hoặc scope không?

### 10.2. Những điều có thể thay đổi nếu cần
- Nếu BFS quá phức tạp, có thể giản lược gameplay (auto dequeue, chỉ cần enqueue)
- Nếu mobile quá khó, có thể focus desktop trước, mobile sau
- Nếu timeframe gấp, có thể giảm từ 3 màn xuống 2 màn
- Nếu cần, có thể thêm DFS song song với BFS (nhưng sẽ tăng scope)

### 10.3. Câu hỏi cần clarification
- Bạn có muốn giữ strict theo plan hay cho phép linh hoạt trong quá trình triển khai?
- Bạn có muốn tôi focus vào quality first (tests, accessibility) hay speed first (demo nhanh)?
- Bạn có muốn tôi báo cáo tiến trình thường xuyên hay chỉ khi hoàn thành?
- Bạn có muốn tôi tự quyết định các chi tiết nhỏ (color palette, animation timing) không?

---

## KẾT LUẬN

Đây là report đề xuất xây dựng game học thuật toán BFS cho project AlgoVenture. MVP tập trung vào:
- 1 thuật toán: BFS (Breadth-First Search)
- 1 game hoàn chỉnh với 3 màn chơi
- Giao diện responsive desktop/tablet/mobile
- Tái sử dụng tối đa kiến trúc hiện tại
- Nhân vật heo Buta với lời thoại ngắn, đúng thời điểm

Sau khi bạn duyệt, tôi sẽ bắt đầu triển khai theo kế hoạch này. Nếu cần điều chỉnh, hãy cho tôi biết các thay đổi cụ thể.
