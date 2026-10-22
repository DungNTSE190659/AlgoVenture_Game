# UI/UX Review Report — AlgoVenture Game (BFS Feature)

**Branch:** `feature/graph-algorithms`  
**Date:** October 20, 2026  
**Phase:** 1 — Research & Audit (NO code changes have been made)  
**Reviewed by:** Kiro AI — UI/UX Design + Engineering Analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current UI/UX Audit](#2-current-uiux-audit)
3. [Reference UI Analysis](#3-reference-ui-analysis)
4. [Creative Design Concepts](#4-creative-design-concepts)
5. [Recommended Direction](#5-recommended-direction)
6. [Mobile Wireframe](#6-mobile-wireframe)
7. [Gameplay Flow](#7-gameplay-flow)
8. [BFS Visualization](#8-bfs-visualization)
9. [Settings Fix Plan](#9-settings-fix-plan)
10. [Implementation Plan](#10-implementation-plan)
11. [Testing Checklist](#11-testing-checklist)
12. [Acceptance Criteria](#12-acceptance-criteria)
13. [Open Questions](#13-open-questions)

---

## 1. Executive Summary

Sau khi đọc toàn bộ code của `feature/graph-algorithms` và ba feature tham khảo (`UI/LinkedList`, `feature/Tree`, `feature/search-game`), tôi xác định được **5 vấn đề nghiêm trọng** cần giải quyết:

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Settings không đóng được bằng click ngoài, không có backdrop | 🔴 Critical |
| 2 | GraphBoard bị lấn át — người chơi phải cuộn để thấy đồ thị | 🔴 Critical |
| 3 | Duplicate narration trong GraphLesson — cùng một đoạn văn xuất hiện hai lần | 🟠 High |
| 4 | Vertex tap target quá nhỏ trên mobile (~26px thay vì ≥44px) | 🔴 Critical |
| 5 | Giao diện trông như CS textbook, chưa tạo cảm giác game | 🟡 Medium |

**Luận điểm trung tâm:** BFS trong game hiện tại là một công cụ minh họa thuật toán được bọc ngoài bằng giao diện game. Người chơi nhìn thấy các ô label kỹ thuật (DEQUEUE, ENQUEUE, QUEUE, Layer L1), một đồ thị SVG đơn giản, và các nút điều khiển. Không có bối cảnh, nhân vật, hoặc lý do để người chơi cảm thấy họ đang chơi game chứ không phải làm bài tập.

---

## 2. Current UI/UX Audit

### 2.1 GraphGame — Màn hình Gameplay

**File:** `src/components/GraphGame.tsx` + `src/graph.css`

#### Vấn đề bố cục

```
[GameHeader: ← BFS · Tìm đường         ⚙]   ← chiếm 64px
[GameStats: ★1000  Lượt 1/8  0 lỗi    ]   ← chiếm ~40px  
[graph-intro: BREADTH-FIRST SEARCH      ]   ← chiếm ~80px
[            "Lấy B ra khỏi queue"      ]
[            "Chọn B ở đầu queue..."    ]
[QUEUE panel: QUEUE  FIFO  [B][C]       ]   ← chiếm ~64px
[GraphBoard SVG                          ]   ← ĐÂY MỚI LÀ PHẦN CHƠI
[Legend: ● Bắt đầu ● Trong queue ...   ]   ← chiếm ~30px
[Feedback: "Chính xác!"                 ]   ← chiếm ~40px
[GameFooter: [↩] [↺] [Buta gợi ý]      ]   ← chiếm ~88px
```

**Vấn đề được xác minh từ code:**

- **B1 — GraphBoard bị chôn vùi:** Trên iPhone SE (375×667px), các phần tử trước GraphBoard chiếm khoảng 288px. Còn lại ~220px cho đồ thị với `max-height: min(42vh, 390px)` = ~280px — nhưng vì board là `width: 100%` với tỷ lệ 3:2, trên 375px width nó sẽ là ~250px cao. Đồ thị lớn hơn không gian còn lại → **người chơi phải scroll để thấy toàn bộ đồ thị và footer cùng lúc** — không bao giờ có được toàn cảnh trong một màn hình.
  - *Nguồn: graph.css line `.graph-board { max-height: min(42vh, 390px) }` + `.graph-content { gap: 14px }` + layout phân tích thủ công*

- **B2 — Back button trong gameplay:** `GameHeader` luôn render nút `ArrowLeft` (về bản đồ). Đây là nút "Back" trong gameplay mà người dùng muốn loại bỏ.
  - *Nguồn: GameHud.tsx — `GameHeader` component không có prop để ẩn nút back*

- **B3 — Restart button trong gameplay:** `GameFooter` trong GraphGame có nút `RotateCcw` (reset) — đây là nút "Restart".
  - *Nguồn: GraphGame.tsx line 280+, footer render khi `!done`*

- **B4 — Thông tin kỹ thuật chiếm không gian:** `graph-kicker` "BREADTH-FIRST SEARCH", `h2` message, `graph-task` instruction, `queue-panel` với nhãn "QUEUE — Vào sau, ra trước · FIFO", `graph-legend` với 4 mục — tất cả đều là thông tin kỹ thuật người chơi không cần ngay.

- **B5 — Tap target quá nhỏ trên mobile:** `vertexRadius = 25` trong một SVG viewBox 600×400. Trên mobile 375px wide: tỉ lệ scale = 375/600 = 0.625. Tap target thực tế = 25 × 2 × 0.625 = **31.25px** — dưới ngưỡng 44px tối thiểu của Apple/Google.
  - *Nguồn: GraphBoard.tsx `const vertexRadius = 25` + SVG `viewBox="0 0 600 400"` + CSS `width: 100%`*

#### Vấn đề trải nghiệm

- **B6 — Không có bối cảnh:** Người chơi không biết tại sao họ đang tìm đường. Node A, B, C không có ý nghĩa gì ngoài nhãn chữ cái.
- **B7 — Instruction text dài:** `taskText` ví dụ: *"Chọn neighbor B để thêm vào queue."* — câu này yêu cầu người chơi đã biết "neighbor", "queue" là gì.
- **B8 — Không có animation khi chọn đúng:** Chỉ có `transition: all 0.3s ease` trên circle fill — không có cảm giác thỏa mãn khi click đúng vertex.

---

### 2.2 GraphLesson — Màn hình Demo

**File:** `src/components/GraphLesson.tsx`

#### Vấn đề được xác minh từ code:

- **L1 — Duplicate narration (BUG):** Cùng một `{frame.narration}` xuất hiện ở **hai chỗ khác nhau** trong JSX:
  ```jsx
  {/* Chỗ 1 - trong section.lesson-stage */}
  <div className="lesson-explanation">
    <p>{frame.narration}</p>   // ← bị ẩn trong layout vì .lesson-stage grid
  </div>
  
  {/* Chỗ 2 - trong div.lesson-narrator */}
  <div className="lesson-narration" aria-live="polite">
    <p>{frame.narration}</p>   // ← hiển thị cùng với Pig mascot
  </div>
  ```
  `.lesson-stage` dùng `grid-template-rows: 72px minmax(180px, 1fr) 122px` — row thứ 3 (122px) là `lesson-explanation`. Trên desktop nó hiển thị, trên mobile portrait (`max-width: 700px`) `lesson-stage` đổi thành `grid-template-rows: 86px minmax(170px, 1fr) 120px` — vẫn còn. Người chơi thấy cùng một câu narration hai lần.

- **L2 — Settings mở/đóng lỗi** (xem phần 9).

- **L3 — Kicker "BFS" trong header quá kỹ thuật:** Title chỉ là "BFS" — không gợi lên bất kỳ câu chuyện hay mục tiêu nào.

---

### 2.3 GraphBoard — Component Đồ thị

**File:** `src/components/GraphBoard.tsx`

- **G1 — Hardcoded pixel coordinates:** Tất cả vertex positions được hardcode trong `graphLesson.ts` và `graph.ts` (ví dụ: `{ id: 0, label: "A", x: 100, y: 100 }`). SVG viewBox cố định 600×400. Không có logic responsive positioning.
- **G2 — Không có identity cho vertex:** Chỉ là chữ cái A-H. Không có hình dạng, biểu tượng, hay màu sắc riêng biệt đủ rõ để phân biệt nhanh bằng mắt.
- **G3 — Layer numbers bị mất trên mobile:** Text `L1`, `L2`... có `fontSize: 12` trong SVG — ở scale 0.625 trên mobile = 7.5px thực tế → **gần như không đọc được**.
- **G4 — Không có visual transition giữa trạng thái:** Circle chuyển màu với `transition: all 0.3s ease` — nhẹ, thiếu drama, không gây cảm giác "chuyện gì đó vừa xảy ra".

---

### 2.4 Settings — Lỗi Mở/Đóng

**Xem phần 9 để phân tích chi tiết.**

---

### 2.5 WorldMap và AdventureMap — Điều Hướng

**Files:** `src/components/WorldMap.tsx`, `src/components/AdventureMap.tsx`

- WorldMap: Thiết kế tốt — carousel swipe với Pig mascot đi bộ giữa các region. Vấn đề nhỏ: nút "Vào" ở bottom sheet có thể bị che bởi virtual keyboard trên mobile nếu người dùng gõ vào.
- AdventureMap: Thiết kế tốt — scrolling road map với track-stops. Pig mascot đi bộ giữa các stop. Bottom sheet với Demo/Challenge buttons.
- **Liên quan đến yêu cầu:** Khi bỏ Back button trong gameplay, luồng thoát duy nhất là qua Settings → "Tiếp tục". Cần xem xét cách người chơi thoát khỏi game nếu cần.

---

## 3. Reference UI Analysis

### 3.1 UI/LinkedList — Điểm mạnh có thể học

| Pattern | Mô tả | Áp dụng được không? |
|---------|--------|---------------------|
| **Tactile nodes** | Node là các khối vật lý 128×76px có thể drag-drop | ✅ Có thể áp dụng cho vertex — làm chúng to hơn, có cảm giác vật thể |
| **Rope connections** | SVG rope nối các node, có animation khi kéo | ⚠️ Concept hay nhưng BFS không phải drag-drop, cần adapt |
| **Settings backdrop** | `.linked-settings-backdrop` — div fixed over full screen, click ngoài đóng | ✅ **Nên copy pattern này** để fix Settings bug |
| **useLinkedDialog hook** | Hook lắng nghe `dialog close` event + keyboard | ✅ Pattern tốt, nhưng đơn giản hơn dùng `showModal()` |
| **Chunky panel headings** | Section number badge + heading + subtext | ✅ Có thể dùng cho Queue panel |
| **flex layout** | `linked-world`: flex column, content `flex: 1 0 auto` | ✅ Đã có trong game, cần tối ưu thêm |

**Điểm đặc biệt của LinkedList:** Người chơi có **hành động vật lý** — kéo khối, cắm đinh, kéo dây. Mỗi hành động có animation riêng. Đây là mức độ "gamification" cao hơn nhiều so với BFS hiện tại.

*Nguồn: Code từ `origin/UI/LinkedList:src/components/LinkedListGame.tsx` và `src/linkedList.css`*

---

### 3.2 feature/Tree (LinearSearchGame) — Điểm mạnh có thể học

| Pattern | Mô tả | Áp dụng được không? |
|---------|--------|---------------------|
| **Pig chạy dọc array** | `.linear-runner` — Pig mascot animate position theo tile đang xét | ✅ **Rất phù hợp** — có thể làm Pig đi tới vertex đang được DEQUEUE |
| **Target badge nổi bật** | `.linear-target` — badge vàng hiển thị số cần tìm, luôn visible | ✅ Áp dụng cho đỉnh đích (Goal node) |
| **`--tile` CSS variable** | Tile size tự động tính theo số phần tử và viewport width | ✅ Áp dụng cho vertex radius responsive |
| **`<dialog>` + `showModal()`** | Settings dùng native dialog modal đúng cách | ✅ **Copy pattern này** để fix Settings bug |
| **Challenges array** | 3 challenge cố định với context câu chuyện ("Theo dấu con số") | ✅ Đã có difficulty levels, có thể thêm context |
| **useDemoPlayback hook** | Playback với speed multiplier, tách biệt với UI | ✅ GraphLesson có thể dùng pattern tương tự |
| **Hint panel từ footer** | Hint bay lên từ footer với `position: absolute; bottom: 100%` | ✅ GraphGame đã làm tương tự, tốt |
| **`data-motion-paused`** | Pause animation bằng CSS attribute, không JS | ✅ Pattern đơn giản, clean |

**Điểm đặc biệt của LinearSearch:** Câu chuyện "Theo dấu con số", "Gặp đúng số là dừng!" — tạo context mà không cần giải thích thuật toán. Pig chạy dọc mảng tạo metaphor trực quan cho "scanning từng phần tử".

*Nguồn: Code từ `origin/feature/Tree:src/components/LinearSearchGame.tsx` và `src/linear.css`*

---

### 3.3 feature/search-game — Quan sát

File set giống hệt `feature/Tree`. Xác nhận đây là cùng một implementation.

---

### 3.4 So sánh tổng hợp

| Tiêu chí | BFS hiện tại | LinkedList | LinearSearch |
|----------|-------------|------------|--------------|
| Vùng gameplay chiếm % màn hình | ~35% (bị chia sẻ với text) | ~60% | ~55% |
| Tap target tối thiểu | ~31px ❌ | N/A (drag) | ~48-85px ✅ |
| Có bối cảnh game | Không | Có (xây danh sách) | Có ("Theo dấu") |
| Settings hoạt động đúng | Không ❌ | Có ✅ | Có ✅ |
| Mascot tham gia gameplay | Không (chỉ trong hint) | Không | Có (chạy dọc) |
| Animation phản hồi | Nhẹ | Mạnh | Trung bình |
| Duplicate content bug | Có (Lesson) | Không | Không |

---

## 4. Creative Design Concepts

### Concept A — "Buta Tìm Kho Báu" (Narrative Wrapper)
**Đây là đề xuất mới — chưa tồn tại trong game.**

**Ý tưởng:** Thay vì hiển thị đồ thị trừu tượng với nhãn A-H, đặt BFS trong bối cảnh: Buta (chú heo mascot) đang tìm đường đến kho báu. Các vertex là **địa điểm** (làng, chợ, đền, v.v.). Người chơi hướng dẫn Buta khám phá từng địa điểm theo thứ tự BFS.

**Cách hoạt động kỹ thuật (không thay đổi BFS):**
- Vertex = địa điểm có icon nhỏ (emoji hoặc icon đơn giản)
- Start = vị trí Buta hiện tại (có Pig icon)
- Goal = kho báu (treasure chest icon)  
- DEQUEUE action = Buta "đi đến" địa điểm đó
- ENQUEUE action = Buta "khám phá" địa điểm lân cận
- Queue hiển thị như "hành trình tiếp theo" không phải FIFO abstract

**Đánh giá:**
- ✅ Trực quan, dễ hiểu với người không biết BFS
- ✅ Không thay đổi logic thuật toán
- ⚠️ Cần thêm icon/label cho vertex → thay đổi `graph.ts` data nhưng KHÔNG thay đổi BFS algorithm
- ⚠️ Cần animation Pig di chuyển → công sức trung bình
- ❌ **Nếu thêm Pig movement animation**: cần new state, new animation logic → scope lớn hơn

**Chi phí ước tính:** 2-3 ngày dev nếu chỉ thêm icon + label + bỏ kỹ thuật text. 4-5 ngày nếu thêm Pig movement animation.

---

### Concept B — "Map Grid" (Grid-based BFS)
**Đây là đề xuất mới — chưa tồn tại trong game.**

**Ý tưởng:** Thay đồ thị dạng node-edge bằng lưới ô vuông (grid). BFS trên grid dễ nhìn hơn nhiều — người chơi thấy "sóng lan rộng" từ điểm xuất phát.

**Đánh giá:**
- ✅ Trực quan nhất cho BFS ("wave expansion")
- ✅ Tap target lớn hơn (ô vuông to hơn circle)
- ❌ **Thay đổi cấu trúc dữ liệu** từ graph sang grid → thay đổi engine đáng kể
- ❌ Mất tính chính xác với "BFS trên đồ thị" theo syllabus

**Kết luận:** Không khuyến nghị trong phạm vi hiện tại.

---

### Concept C — "Tối ưu Layout Trước, Narrative Sau" *(KHUYẾN NGHỊ)*
**Kết hợp từ cái đã có và pattern từ reference features.**

**Ý tưởng:** Giải quyết ngay các vấn đề layout và UX kỹ thuật trước. Thêm narrative wrapper nhẹ (không cần animation phức tạp) để tạo bối cảnh.

**Ba thay đổi chính:**
1. **Layout**: GraphBoard lên đầu content, thu gọn hoặc collapse các panel phụ
2. **Narrative**: Thêm context label cho vertex (địa điểm đơn giản) + thay "BREADTH-FIRST SEARCH" bằng một câu mục tiêu đơn giản
3. **Interaction**: Tăng tap target (vertexRadius responsive), fix Settings, bỏ Back+Restart

**Đánh giá:**
- ✅ Scope nhỏ nhất, rủi ro thấp nhất
- ✅ Không thay đổi BFS logic
- ✅ Giải quyết được tất cả 5 vấn đề critical
- ✅ Phù hợp với pattern từ LinearSearchGame (target badge nổi bật + gameplay first)
- ⚠️ Không tạo dramatic narrative như Concept A

---

### Concept D — "Pig Walk on Graph" (Character Movement)
**Đây là đề xuất mới — lấy cảm hứng từ LinearSearchGame.**

**Ý tưởng:** Khi người chơi DEQUEUE một vertex, Pig mascot animate di chuyển đến vertex đó. Tương tự cách Pig chạy dọc array trong LinearSearch.

**Đánh giá:**
- ✅ Tạo feedback trực quan mạnh nhất
- ✅ Pig đã được dùng trong hint panel của GraphGame
- ⚠️ Cần tính toán pixel position của vertex trong SVG để map sang vị trí Pig trên overlay div
- ⚠️ SVG coordinate space khác với CSS layout space → cần `getBoundingClientRect` hoặc transform mapping
- ❌ Nếu làm sai sẽ Pig hiện ở vị trí sai → trở nên buồn cười thay vì hữu ích

**Chi phí ước tính:** 1.5-2 ngày dev nếu làm tốt.

---

## 5. Recommended Direction

### Hướng chính được đề xuất: **Concept C + một phần Concept D**

**Lý do:**
- Concept C giải quyết tất cả vấn đề critical mà không đưa vào technical risk lớn
- Thêm Pig walk đơn giản (Concept D) — chỉ khi DEQUEUE, không phải tất cả actions — tạo feedback hấp dẫn với chi phí vừa phải
- Bám sát pattern đã được kiểm chứng trong LinearSearchGame (runner mascot)

### Phạm vi đề xuất cụ thể

**Nhóm 1 — Bug fixes (ưu tiên tuyệt đối):**
- Fix Settings (không đóng được)
- Xóa duplicate narration trong GraphLesson

**Nhóm 2 — Layout (mobile-first):**
- GraphBoard lên đầu content section
- Thu gọn hoặc tách Queue panel thành overlay/collapsible
- Tăng `vertexRadius` responsive (min 32px display radius)
- Bỏ Back button khỏi `GameHeader` khi ở gameplay mode
- Bỏ Restart (RotateCcw) button khỏi footer (lưu ý: giữ logic `reset()` function, chỉ ẩn nút)
- Undo button giữ lại — đây là tính năng game thực sự hữu ích

**Nhóm 3 — Narrative + Feedback (sau khi nhóm 1+2 được duyệt mobile):**
- Thêm "destination label" cho vertex (thay A→B→C bằng tên địa điểm ngắn)
- Thay kicker "BREADTH-FIRST SEARCH" bằng mục tiêu có context: "Tìm đường ngắn nhất đến kho báu"
- Pig mascot xuất hiện ở vertex đang được xét (DEQUEUE) — static, không animation đầy đủ
- Thêm animation `pop` khi click đúng vertex (scale + color flash)

**Nhóm 4 — Nếu được duyệt sau mobile validation:**
- Desktop adaptation

### Phương án thay thế nếu bị từ chối

Nếu không muốn thêm narrative wrapper (Nhóm 3), chỉ thực hiện Nhóm 1+2 cũng giải quyết được tất cả vấn đề critical. Game sẽ hoạt động đúng và dễ dùng hơn, dù vẫn giữ phong cách "CS textbook" với visual được cải thiện.

---

## 6. Mobile Wireframe

### 6.1 GraphGame — Màn hình Gameplay (Mobile 375×812px)

```
┌─────────────────────────────────┐  ← 375px wide
│                                 │
│  [⚙ Tùy chọn]    BFS · Tìm đường│  ← 56px — Compact header, no Back btn
│                                 │
├─────────────────────────────────┤
│  ★ 1,000  │  Lượt 1/8  │ 0 lỗi │  ← 36px — Stats bar compact
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │   [ Kho báu: Đền E ]     │   │  ← Goal badge — nổi bật, luôn visible
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────────┐│
│  │   GRAPH BOARD (SVG)          ││  ← ~220px height, tối đa 58% viewport
│  │                              ││    Vertex radius ~30-32px rendered
│  │  (A)──(B)──(D)               ││    Tap target ≥ 44px với padding
│  │   └──(C)──(E)                ││
│  │                              ││
│  └──────────────────────────────┘│
│                                 │
│  ┌──────────────────────────┐   │  ← Task instruction — 1 dòng ngắn gọn
│  │ 📍 Chọn B — đầu hàng chờ │   │    Không dùng thuật ngữ kỹ thuật
│  └──────────────────────────┘   │
│                                 │
│  Hàng chờ: [B] [C]              │  ← Queue hiển thị nhỏ gọn, inline
│                                 │
├─────────────────────────────────┤
│                                 │
│  [↩ Hoàn tác]  [💡 Gợi ý ...]  │  ← Footer: 2 nút, không có Restart
│                                 │
└─────────────────────────────────┘
```

**Thay đổi so với hiện tại:**
- Header: bỏ ArrowLeft, chỉ có Settings (⚙) + title
- Goal badge: thay thế kicker kỹ thuật, luôn visible ở đầu
- GraphBoard: lên gần đầu màn hình, không bị chôn vùi
- Task text: ngắn, 1 dòng, không dùng DEQUEUE/ENQUEUE
- Queue: inline nhỏ gọn, không phải panel riêng
- Footer: chỉ Undo + Hint, không có Restart

---

### 6.2 GraphLesson — Màn hình Demo (Mobile 375×812px)

```
┌─────────────────────────────────┐
│                                 │
│  [⚙]     BFS · Tìm đường        │  ← No Back btn (có "Bắt đầu thử" ở cuối)
│                                 │
├─────────────────────────────────┤
│  Bước 3 / 12    ████████░░░░░   │  ← Progress bar compact
├─────────────────────────────────┤
│                                 │
│  "Lấy A ra khỏi hàng chờ"      │  ← Title — ngắn gọn (từ frame.title)
│                                 │
│  ┌──────────────────────────────┐│
│  │   GRAPH BOARD (SVG)          ││  ← Phần lớn nhất màn hình
│  │       (animated)             ││    ~230px
│  └──────────────────────────────┘│
│                                 │
│  ┌──────────────────────────────┐│
│  │🐷│ "A đang ở đầu hàng chờ. │ ││  ← Pig + narration — 1 khối duy nhất
│  │  │  Lấy ra để xét neighbor."│ ││    Xóa duplicate
│  └──────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│                                 │
│  [⏮]  [▶ Tiếp tục]  [⏭]         │  ← Playback controls
│                                 │
└─────────────────────────────────┘
```

**Thay đổi:**
- Xóa `lesson-explanation` div (duplicate narration)
- Giữ `lesson-narrator` div (Pig + narration) như nguồn duy nhất

---

### 6.3 Settings Modal (Mobile)

```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Backdrop blur (click ngoài = đóng)
│ ░  ┌─────────────────────────┐ ░│
│ ░  │ Tùy chọn            [✕] │ ░│  ← X rõ ràng
│ ░  │─────────────────────────│ ░│
│ ░  │ 🔊 Âm thanh    [Bật  ▼] │ ░│
│ ░  │─────────────────────────│ ░│
│ ░  │ Độ khó          [Dễ  ▼] │ ░│
│ ░  │─────────────────────────│ ░│
│ ░  │ [     Tiếp tục      ]   │ ░│
│ ░  └─────────────────────────┘ ░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘
```

---

## 7. Gameplay Flow

### Luồng người chơi từ khi vào đến khi hoàn thành

```
[AdventureMap] 
    │ Tap "Thử thách →"
    ▼
[GraphGame - Init]
    │ Người chơi thấy: Goal badge "Tìm đường đến [E]"
    │ GraphBoard với vertex màu rõ ràng
    │ Task hint: "Bắt đầu từ [A]"
    ▼
[Bước 1 — DEQUEUE Start]
    │ Task: "Chọn A — đang ở đầu hàng chờ"
    │ → Tap A
    │ ← Flash animation xanh "Đúng rồi!"
    │ ← A đổi màu sang "đang xét" (tím)
    │ ← Queue cập nhật
    ▼
[Bước 2 — ENQUEUE Neighbors]
    │ Task: "Khám phá từ A: chọn B"
    │ → Tap B
    │ ← Flash animation, B vào queue (xanh dương)
    │ Task: "Khám phá từ A: chọn C"
    │ → Tap C
    │ ← Flash animation, C vào queue
    ▼
[Bước N — FOUND]
    │ Task: "Tìm thấy kho báu! Chọn E"
    │ → Tap E
    │ ← Path highlight animation (toàn bộ đường đi sáng lên)
    ▼
[VictoryCelebration]
    │ Stars, điểm, đường đi: A → C → E
    │ [Chơi lại] [Khó hơn] [Bản đồ]
```

### Luồng khi người chơi sai

```
[Bất kỳ bước nào]
    │ → Tap vertex sai
    ← Shake animation trên vertex sai
    ← Feedback text ngắn: "Không phải đây — chọn vertex đầu hàng chờ"
    ← Score -50 (không block, có thể tiếp tục ngay)
```

### Luồng thoát (không còn Back button)

```
[Đang chơi]
    │ → Tap ⚙ Settings
    ▼
[Settings Modal mở]
    │ → Tap "Về bản đồ" (nút trong Settings)
    ▼
[AdventureMap]
```

**Đây là thay đổi quan trọng:** Khi bỏ Back button, Settings modal cần có thêm nút "Về bản đồ" để người chơi có lối thoát. Đây là pattern phổ biến trong mobile games (pause menu = exit point).

---

## 8. BFS Visualization

### 8.1 BFS làm gì trong game hiện tại

Từ code `graph.ts` và `GraphGame.tsx`:

1. **`createBFSTimeline(graph)`** sinh ra một mảng `BFSStep[]` trước khi game bắt đầu. Toàn bộ "đường đi đúng" đã được tính sẵn.
2. Người chơi không **thực sự** chạy BFS — họ **làm lại** từng bước BFS đã được tính sẵn, theo đúng thứ tự.
3. Actions người chơi thực hiện: **DEQUEUE** (chọn vertex ở đầu queue để xét), **ENQUEUE** (chọn neighbor chưa thăm để thêm vào queue), **FOUND** (chọn đích khi nó lên đầu queue).
4. `validateBFSAction()` kiểm tra xem người chơi có chọn đúng vertex không.

### 8.2 Cách trực quan hóa hiện tại

| Trạng thái BFS | Màu hiện tại | Điểm mạnh | Điểm yếu |
|----------------|-------------|-----------|----------|
| Unvisited | Xám `#95a5a6` | Neutral | Không nổi bật trên background |
| In queue | Xanh dương `#3498db` | Dễ nhận | Màu quá "system UI" |
| Current (being examined) | Tím `#9b59b6` | Phân biệt được | Thiếu animation |
| Visited | Xanh lá `#2ecc71` | Trực quan "done" | Đồng màu với path |
| Start | Cam `#f39c12` | Nổi bật | OK |
| Goal | Đỏ `#e87565` | Nổi bật | OK |
| Path | Xanh đậm `#25a875` | Rõ ràng | Quá giống visited |

### 8.3 Đề xuất cải thiện visualization (không thay đổi BFS)

**Không được thay đổi:**
- Thứ tự xử lý BFS (FIFO queue)
- Logic validate DEQUEUE/ENQUEUE/FOUND
- Kết quả đường đi ngắn nhất

**Có thể thay đổi (visual only):**

1. **Animation khi DEQUEUE:** Vertex "bật ra" từ queue position vào "current" position — scale up nhẹ + màu đổi
2. **Animation khi ENQUEUE:** Vertex "nhảy vào" queue — slide effect từ vị trí node vào queue panel
3. **Animation khi FOUND:** Toàn bộ path highlight từng node theo thứ tự — "lighting up" animation
4. **Vertex idle animation (chờ xét):** Vertex trong queue có nhẹ pulse animation để phân biệt với unvisited
5. **Layer ripple:** Khi ENQUEUE, có thể show brief ripple effect từ current vertex ra neighbors — visualize BFS "wave"

**Cẩn trọng:**
- Animation khi ENQUEUE không được suggest "thứ tự sai" — nếu có 2 neighbors, cả hai đều cần animate, không cái nào trước
- Không thêm animation che khuất tương tác người chơi
- Animation phải hoàn thành trước khi người chơi có thể click lần tiếp theo (hoặc click-through phải disable trong thời gian animation)

### 8.4 Đề xuất context label cho vertex

Thay chữ cái A-H bằng tên địa điểm ngắn gọn theo difficulty:

| Difficulty | Vertex labels | Context |
|------------|--------------|---------|
| Tutorial (5 nodes) | Nhà, Chợ, Trường, Chùa, Đền | Buta tìm đường đến Đền |
| Cycle (6 nodes) | Làng, Rừng, Suối, Núi, Hang, Kho | Buta tìm kho báu |
| Complex (8 nodes) | Nhà, Chợ, Trường, Chùa, Rừng, Suối, Núi, Kho | Buta tìm kho báu trên núi |

**Lưu ý:** Thay đổi này cần sửa data trong `graph.ts` (field `label` của Vertex) nhưng **không thay đổi BFS algorithm**. Đây là display-only change.

**Rủi ro:** Tên dài hơn 1-2 ký tự → text trong SVG circle có thể bị tràn. Cần giảm font size hoặc dùng icon thay text. *Sẽ cần quyết định từ bạn trước khi implement.*

---

## 9. Settings Fix Plan

### 9.1 Phân tích lỗi từ code

**GraphGame.tsx — `GraphSettings` component:**
```jsx
// HIỆN TẠI — SAI
<dialog className="modal lesson-settings" open onClose={onClose}>
```

**Vấn đề:**
1. `open` prop trong JSX → React set attribute `open` trực tiếp → dialog render **non-modal** (không phải modal)
2. Non-modal dialog không có `::backdrop` — vì thế không có overlay mờ
3. Non-modal dialog không block click ra ngoài
4. `onClose` event trên `<dialog>` chỉ fires khi: (a) Escape key được nhấn, (b) `dialog.close()` được gọi
5. Không có `backdrop` click handler → không thể đóng bằng cách tap ngoài

**Kết quả lỗi quan sát được:**
- Settings panel hiện như một floating div không có backdrop
- Không thể đóng bằng cách tap ra ngoài
- Người chơi bị stuck trong Settings (chỉ thoát qua Escape hoặc nút X)

**GraphLesson.tsx — Tương tự:**
```jsx
// HIỆN TẠI — SAI (cùng pattern)
<dialog className="modal lesson-settings" open onClose={onClose}>
```

### 9.2 Giải pháp — Pattern từ LinearSearchGame

**Cách đúng (từ `feature/Tree:LinearSearchGame.tsx`):**
```tsx
// Đúng — dùng useRef + showModal()
const settingsDialog = useRef<HTMLDialogElement>(null);

useEffect(() => {
  if (!settings) return;
  const previous = document.activeElement as HTMLElement | null;
  const dialog = settingsDialog.current;
  dialog?.showModal();           // ← render as modal với ::backdrop
  return () => { 
    dialog?.close(); 
    previous?.focus();           // ← trả focus về nút mở settings
  };
}, [settings]);

// Trong JSX:
<dialog ref={settingsDialog} className="modal lesson-settings" 
        onClose={() => setSettings(false)}>
```

**Thêm click-outside để đóng:**
```tsx
// Thêm vào dialog element:
onClick={(e) => { 
  if (e.target === e.currentTarget) onClose(); 
  // Click trên backdrop (target = dialog itself, không phải content bên trong)
}}
```

### 9.3 Thêm "Về bản đồ" vào Settings

Vì Back button bị xóa khỏi gameplay, Settings cần có lối thoát:

```tsx
// Trong GraphSettings component, thêm vào lesson-setting-actions:
<button onClick={() => { onClose(); onBack(); }}>
  Về bản đồ
</button>
```

Cần thêm `onBack` prop vào `GraphSettings`.

### 9.4 Files cần sửa

| File | Thay đổi |
|------|---------|
| `src/components/GraphGame.tsx` | Sửa `GraphSettings` component — dùng `useRef + showModal()` |
| `src/components/GraphLesson.tsx` | Sửa `GraphSettings` component — cùng pattern |
| `src/styles.css` | Đảm bảo `.modal::backdrop` có style (đã có từ line có `backdrop-filter: blur(6px)`) |

---

## 10. Implementation Plan

### Phase 3 — Mobile Implementation (chờ duyệt)

**Thứ tự thực hiện đề xuất:**

#### Bước 1 — Bug Fixes (rủi ro thấp nhất, làm trước)
| # | File | Thay đổi | Rủi ro |
|---|------|---------|--------|
| 1a | `GraphGame.tsx` | Fix GraphSettings: useRef + showModal() + click-outside + add "Về bản đồ" button | Thấp |
| 1b | `GraphLesson.tsx` | Fix GraphSettings: cùng pattern | Thấp |
| 1c | `GraphLesson.tsx` | Xóa `<div className="lesson-explanation">` duplicate narration | Thấp |

#### Bước 2 — Layout Refactor (rủi ro trung bình)
| # | File | Thay đổi | Rủi ro |
|---|------|---------|--------|
| 2a | `GameHud.tsx` | Thêm prop `showBack?: boolean` vào `GameHeader` (default true để không break other games) | Thấp |
| 2b | `GraphGame.tsx` | Pass `showBack={false}` vào GameHeader | Thấp |
| 2c | `GraphGame.tsx` | Bỏ nút Restart (RotateCcw) khỏi GameFooter. Giữ nguyên `reset()` function | Thấp |
| 2d | `graph.css` | Đưa GraphBoard lên trên queue panel trong layout | Trung bình |
| 2e | `graph.css` | Responsive vertexRadius — dùng `--vertex-r` CSS var | Trung bình |
| 2f | `GraphBoard.tsx` | Dùng `--vertex-r` CSS var hoặc nhận `radius` prop responsive | Trung bình |

#### Bước 3 — Narrative + Feedback (rủi ro trung bình, sau khi Bước 1+2 được duyệt mobile)
| # | File | Thay đổi | Rủi ro |
|---|------|---------|--------|
| 3a | `graph.ts` | Thêm `displayLabel` field cho vertex (không thay đổi BFS) | Thấp |
| 3b | `GraphBoard.tsx` | Hiển thị `displayLabel` thay `label` nếu có | Thấp |
| 3c | `graph.css` | Thay kicker text style, thêm goal badge style | Thấp |
| 3d | `GraphGame.tsx` | Thay text "BREADTH-FIRST SEARCH" bằng goal context | Thấp |
| 3e | `graph.css` | Thêm CSS animation: vertex pop khi click đúng | Thấp |

#### Bước 4 — Pig Walk (rủi ro cao hơn, sau khi Bước 3 được duyệt)
| # | File | Thay đổi | Rủi ro |
|---|------|---------|--------|
| 4a | `GraphBoard.tsx` | Expose vertex SVG positions qua callback/ref | Trung bình |
| 4b | `GraphGame.tsx` | Track `currentVertex` position, render Pig overlay | Trung bình |
| 4c | `graph.css` | Pig position animation | Trung bình |

### Các component KHÔNG được sửa (trừ khi có lý do)
- `src/engine/graph.ts` — BFS algorithm logic (chỉ thêm `displayLabel` nếu chọn Bước 3a)
- `src/engine/graphLesson.ts` — Lesson content logic
- `src/components/AdventureMap.tsx` — Navigation
- `src/components/WorldMap.tsx` — World map
- `src/engine/learningTrack.ts` — Progress tracking

---

## 11. Testing Checklist

> **Ghi chú:** Tất cả items dưới đây là `NOT TESTED` vì Phase 1 chỉ thực hiện code audit, không chạy ứng dụng. Checklist này sẽ được điền sau khi Phase 3 implementation hoàn thành.

### 6.1 UI layout và responsive

- [ ] `NOT TESTED` Gameplay là vùng nổi bật nhất trên màn hình.
- [ ] `NOT TESTED` Không còn thông tin trùng lặp không cần thiết.
- [ ] `NOT TESTED` Không có thành phần quan trọng bị che khuất hoặc chồng lấn.
- [ ] `NOT TESTED` Các nút và vùng tương tác có kích thước phù hợp với thao tác chạm.
- [ ] `NOT TESTED` Chữ dễ đọc, kích thước và độ tương phản phù hợp.
- [ ] `NOT TESTED` Hình ảnh và icon không bị mờ hoặc biến dạng rõ rệt.
- [ ] `NOT TESTED` Hình nền không bị cắt sai, xuất hiện viền đen không mong muốn hoặc làm mất nội dung quan trọng.
- [ ] `NOT TESTED` Không có nội dung tràn khỏi màn hình hoặc bị cắt ở các tỷ lệ khung hình đã kiểm tra.
- [ ] `NOT TESTED` Không có thanh cuộn không cần thiết trong màn hình gameplay.
- [ ] `NOT TESTED` Các trạng thái enable/disable của nút được thể hiện rõ và hoạt động đúng.
- [ ] `NOT TESTED` Không còn nút Back và Restart trong giao diện gameplay.
- [ ] `NOT TESTED` Các màn hình, popup và menu dùng phong cách nhất quán.
- [ ] `NOT TESTED` Kiểm tra các kích thước màn hình mobile khác nhau.
- [ ] `NOT TESTED` Kiểm tra portrait/landscape nếu game hỗ trợ cả hai.
- [ ] `NOT TESTED` Kiểm tra desktop sau khi phiên bản mobile được duyệt.

**Lỗi đã xác minh từ code audit (sẽ kiểm tra lại sau fix):**
- `FAIL` (xác minh từ code) Duplicate narration trong GraphLesson — cùng text hiện hai lần
- `FAIL` (xác minh từ code) Tap target vertex ~31px trên mobile 375px — dưới 44px
- `FAIL` (xác minh từ code) Không còn nút Back trong gameplay — hiện tại GameHeader luôn có ArrowLeft

### 6.2 Gameplay và khả năng sử dụng

- [ ] `NOT TESTED` Người chơi có thể xác định mục tiêu chính ngay khi vào màn chơi.
- [ ] `NOT TESTED` Người chơi có thể xác định vùng cần tương tác.
- [ ] `NOT TESTED` Hướng dẫn đủ ngắn để người chơi bắt đầu nhanh.
- [ ] `NOT TESTED` Thao tác chạm hoặc nhấn được xử lý đúng.
- [ ] `NOT TESTED` Lặp lại thao tác chạm/nhấn không gây lỗi hoặc tạo trạng thái bất thường.
- [ ] `NOT TESTED` Mỗi thao tác quan trọng có phản hồi trực quan.
- [ ] `NOT TESTED` Trạng thái đang xử lý, thành công và thất bại được phân biệt rõ nếu có.
- [ ] `NOT TESTED` Có thể chơi từ đầu đến cuối theo luồng bình thường.
- [ ] `NOT TESTED` Có thể thử các trường hợp hợp lệ và không hợp lệ theo luật chơi.
- [ ] `NOT TESTED` Các đối tượng và nhân vật không di chuyển ra ngoài vùng cho phép.
- [ ] `NOT TESTED` Chuyển động và animation không làm che khuất thao tác hoặc thông tin quan trọng.
- [ ] `NOT TESTED` Người chơi không bị mắc kẹt ở một trạng thái không thể tiếp tục.
- [ ] `NOT TESTED` Thuật toán và kết quả gameplay vẫn chính xác sau thay đổi UI.
- [ ] `NOT TESTED` Nếu có tutorial, kiểm tra việc bỏ dở, tiếp tục và hoàn thành tutorial.
- [ ] `NOT TESTED` Nếu có level hoặc tiến trình mở khóa, kiểm tra các trạng thái liên quan.

**Phân tích tĩnh từ code:**
- `FAIL` (xác minh từ code) Mục tiêu chưa rõ — không có goal context, chỉ có label kỹ thuật
- `FAIL` (xác minh từ code) Hướng dẫn dùng thuật ngữ kỹ thuật (DEQUEUE, ENQUEUE, queue)
- `PASS` (xác minh từ code) Logic thuật toán BFS chính xác — engine đã được test
- `PASS` (xác minh từ code) Undo hoạt động đúng — `history` stack implementation đúng
- `PASS` (xác minh từ code) VictoryCelebration trigger đúng khi `done === true`

### 6.3 Settings và điều hướng

- [ ] `FAIL` (xác minh từ code) Settings mở được. *(Mở được nhưng render sai — non-modal)*
- [ ] `FAIL` (xác minh từ code) Settings đóng được bằng nút đóng. *(Chỉ X button, không có backdrop)*
- [ ] `FAIL` (xác minh từ code) Cơ chế chạm ra ngoài để đóng hoạt động. *(Không có, chưa implement)*
- [ ] `NOT TESTED` Settings không bị cắt hoặc tràn trên màn hình nhỏ.
- [ ] `NOT TESTED` Đóng Settings không làm hỏng trạng thái gameplay.
- [ ] `NOT TESTED` Không có popup bị kẹt hoặc nhiều lớp giao diện chồng lên nhau.
- [ ] `NOT TESTED` Các cài đặt hiện có được áp dụng đúng.
- [ ] `NOT TESTED` Các cài đặt được lưu và khôi phục đúng nếu game đã hỗ trợ lưu cài đặt.
- [ ] `FAIL` (xác minh từ code) Các luồng điều hướng vẫn hoạt động sau khi bỏ nút Back. *(Back button chưa được bỏ — sẽ cần lối thoát qua Settings)*

### 6.4 Regression testing sau mỗi thay đổi UI

*Tất cả sẽ được kiểm tra sau Phase 3 implementation*

- [ ] `NOT TESTED` Màn hình chính vẫn hoạt động bình thường.
- [ ] `NOT TESTED` Gameplay vẫn bắt đầu và chạy được.
- [ ] `NOT TESTED` Các vùng tương tác vẫn nhận input đúng.
- [ ] `NOT TESTED` Nhân vật, vật thể và vùng chơi vẫn hiển thị đúng.
- [ ] `NOT TESTED` Các trạng thái UI không che khuất nhau.
- [ ] `NOT TESTED` Settings vẫn mở/đóng được.
- [ ] `NOT TESTED` Kết quả thuật toán và logic gameplay không thay đổi ngoài dự kiến.
- [ ] `NOT TESTED` Layout trên mobile không bị lỗi sau các chỉnh sửa mới.
- [ ] `NOT TESTED` Những tính năng liên quan đến component dùng chung (GameHud, GameHeader) vẫn hoạt động.

**Quan trọng:** Khi thêm `showBack` prop vào `GameHeader`, cần regression test: SelectionGame, InsertionGame, BubbleGame, ExpeditionPlay, DemoLesson — tất cả đều dùng GameHeader. Default `showBack={true}` đảm bảo backward compatibility.

### 6.5 Graphics, animation và hiệu năng cơ bản

- [ ] `NOT TESTED` Animation không bị giật rõ rệt trong các tình huống đã kiểm tra.
- [ ] `NOT TESTED` Animation không làm chậm hoặc chặn thao tác người chơi không cần thiết.
- [ ] `NOT TESTED` Các hiệu ứng được dùng có mục đích và không gây rối mắt.
- [ ] `NOT TESTED` Các chuyển động phản ánh đúng trạng thái thực tế của game.
- [ ] `NOT TESTED` Thời gian tải màn hình và chuyển trạng thái không gây chờ đợi bất hợp lý.
- [ ] `NOT TESTED` Kiểm tra các lỗi hiển thị hoặc giảm hiệu năng trên thiết bị/môi trường có thể tiếp cận.
- [ ] `NOT TESTED` Nếu có điều kiện sử dụng thiết bị thực, kiểm tra gameplay trên thiết bị thực.
- [x] `N/A — ghi nhận` Kết quả chỉ dựa trên code audit, chưa kiểm tra trên browser/emulator.

### 6.6 Âm thanh và trạng thái ứng dụng

- [ ] `NOT TESTED` Game có âm thanh (gameAudio) — kiểm tra bật/tắt và phản hồi.
- [ ] `NOT TESTED` Âm thanh cho thao tác đúng/sai/gợi ý — kiểm tra đồng bộ.
- [ ] `NOT TESTED` Visibility change (chuyển app sang background) — đã có handler trong code.
- [x] `N/A` Lưu trạng thái phiên chơi — game không persist GraphGame state (chỉ persist `completed` progress).
- [x] `N/A` Đổi ngôn ngữ — game chỉ có tiếng Việt.

### 6.7 Ngoài phạm vi

- [x] `N/A` Payment, mua hàng
- [x] `N/A` Login, đăng ký
- [x] `N/A` Multiplayer
- [x] `N/A` Leaderboard
- [x] `N/A` Social share

---

## 12. Acceptance Criteria

### Mobile (phải đạt trước khi chuyển sang Desktop)

| # | Tiêu chí | Cách đo |
|---|---------|---------|
| M1 | GraphBoard chiếm ít nhất 40% viewport height trên iPhone SE (375×667) | DevTools device emulator |
| M2 | Tất cả vertex tap target ≥ 44px (sau khi tính padding/hitbox) | DevTools + manual tap test |
| M3 | Settings mở được bằng modal đúng (có backdrop) | Manual test |
| M4 | Settings đóng được bằng: (a) nút X, (b) tap backdrop, (c) Escape | Manual test mỗi method |
| M5 | Settings không hiển thị bị cắt trên màn hình 375×667 | DevTools device emulator |
| M6 | Không có nút Back trong gameplay header | Visual inspection |
| M7 | Không có nút Restart trong gameplay footer | Visual inspection |
| M8 | Có lối thoát về bản đồ (qua Settings) | Manual flow test |
| M9 | Không có duplicate narration trong GraphLesson | Visual inspection |
| M10 | BFS logic không thay đổi — kết quả đường đi vẫn chính xác | Run existing tests: `vitest --run` |
| M11 | SelectionGame, InsertionGame, BubbleGame vẫn có Back button | Regression test mỗi game |
| M12 | Người chơi có thể hoàn thành 1 game BFS từ đầu đến cuối | End-to-end manual test |

### Desktop (sau khi Mobile được duyệt)

| # | Tiêu chí | Cách đo |
|---|---------|---------|
| D1 | Layout desktop không phóng to nguyên mobile | Visual check ở 1280px+ |
| D2 | GraphBoard max-width được tận dụng tốt | Visual check |
| D3 | Tất cả mobile criteria vẫn pass trên mobile viewport | Regression |

---

## 13. Open Questions

Những vấn đề **tôi cần bạn quyết định** trước khi implement:

### Q1 — Narrative labels cho vertex: Có làm không?
**Bối cảnh:** Thay A→B→C bằng Nhà→Chợ→Đền v.v. tạo context game, nhưng label dài hơn cần xử lý trong SVG.
**Options:**
- A) Giữ chữ cái (A-H) — đơn giản, ít risk
- B) Thêm context label bên dưới chữ cái — ví dụ: "A" lớn + "Nhà" nhỏ bên dưới
- C) Thay hoàn toàn bằng tên ngắn (2-3 ký tự) — "NHÀ", "CHỢ"
- D) Dùng icon emoji thay text — 🏠, 🏪, 🏯

### Q2 — Pig mascot trong GraphGame: Mức độ nào?
**Bối cảnh:** LinearSearchGame có Pig chạy dọc array, tạo feedback rất hấp dẫn.
**Options:**
- A) Không thêm Pig vào gameplay (chỉ trong hint panel như hiện tại)
- B) Pig static ở vị trí vertex đang xét (không animation di chuyển)
- C) Pig animate di chuyển khi DEQUEUE (scope lớn hơn, ~1.5-2 ngày thêm)

### Q3 — Queue panel: Giữ hay thu gọn?
**Bối cảnh:** Queue panel chiếm ~64px và hiển thị thông tin kỹ thuật. Nhưng đây là phần core của bài học BFS.
**Options:**
- A) Giữ nguyên nhưng thu gọn (inline, không phải panel to)
- B) Thu vào collapsible — tap để xem/ẩn
- C) Xóa khỏi gameplay, chỉ giữ trong Demo
- D) Giữ nguyên size (không thu gọn, chấp nhận scroll)

### Q4 — Bỏ Back button: Xử lý GraphLesson thế nào?
**Bối cảnh:** GraphLesson (Demo mode) hiện có Back button. User request là bỏ Back trong "gameplay". Demo có phải "gameplay" không?
**Options:**
- A) Bỏ Back ở cả GraphGame VÀ GraphLesson
- B) Chỉ bỏ Back ở GraphGame (gameplay thực sự), giữ ở GraphLesson (demo)
- C) Thay Back ở GraphLesson bằng nút "Bỏ qua Demo → Thử ngay" để thoát

### Q5 — Restart button: Có thêm lại qua Settings không?
**Bối cảnh:** Khi bỏ Restart khỏi footer, người chơi mất khả năng reset game nhanh.
**Options:**
- A) Chỉ có trong Settings (Pause menu) — "Chơi lại từ đầu" *(đã có trong Settings hiện tại)*
- B) Bỏ hoàn toàn — muốn chơi lại thì dùng VictoryCelebration → "Chơi lại"
- C) Giữ Restart nhưng thu nhỏ (icon only, không label)

---

*Report được tạo tự động từ code audit. Không có code nào được thay đổi trong quá trình này.*  
*Branch `feature/graph-algorithms` vẫn ở trạng thái clean sau khi audit.*
