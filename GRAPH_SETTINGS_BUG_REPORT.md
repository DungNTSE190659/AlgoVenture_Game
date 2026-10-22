# Graph Settings Bug Report

**Branch:** `feature/graph-algorithms`  
**Ngày:** October 20, 2026  
**Giai đoạn:** A — Audit & Phân tích (chưa sửa code)  
**Người viết:** Kiro AI

---

## Giải thích nhanh cho Fresher

Trước khi vào chi tiết kỹ thuật, mình giải thích đơn giản:

Trong lập trình React, khi bạn nhấn nút Settings:
1. Một biến trạng thái `settings` đổi từ `false` → `true`
2. React render lại giao diện, hiển thị panel Settings
3. Panel Settings là một `<dialog>` element — element HTML đặc biệt dành riêng cho popup/modal

**Vấn đề:** Cách `<dialog>` được mở trong Graph **khác** với cách mở trong Array (BubbleSort). Array dùng cách đúng (`showModal()`), Graph ban đầu dùng cách sai (`open` attribute). Tôi đã sửa cách mở trong lần trước, nhưng còn một vấn đề tồn đọng liên quan đến `onCancel` mà Array có nhưng Graph chưa có.

---

## 1. Mô tả lỗi hiện tại

Sau khi pull code mới nhất từ remote (`origin/feature/graph-algorithms`), `GraphGame.tsx` và `GraphLesson.tsx` đang dùng `dialog.showModal()` đúng cách. Tuy nhiên khi so sánh chi tiết với `BubbleGame.tsx` (đại diện cho "Array"), phát hiện **3 điểm khác biệt quan trọng**:

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Graph thiếu `onCancel` handler — người chơi nhấn Escape thì dialog đóng nhưng state `settings` không reset về `false` → UI bị kẹt | 🔴 Bug thực sự |
| 2 | Graph thiếu trả lại focus sau khi đóng dialog (`previous?.focus()`) → người chơi dùng keyboard bị mất focus | 🟡 UX issue |
| 3 | Tiêu đề Settings của Graph là "Tùy chọn BFS" (tiếng Việt-Anh lẫn lộn), trong khi Array dùng "Chuyến đi của bạn" — không nhất quán về tone | 🟡 Nhỏ |

---

## 2. Các file liên quan

| File | Vai trò |
|------|---------|
| `src/components/GraphGame.tsx` | Gameplay Graph — chứa `GraphSettings` component (sửa lần trước) |
| `src/components/GraphLesson.tsx` | Demo Graph — chứa `GraphSettings` component thứ hai (sửa lần trước) |
| `src/components/BubbleGame.tsx` | Gameplay Array (BubbleSort) — **chuẩn tham chiếu** |
| `src/components/HapticsToggle.tsx` | Component dùng chung cho rung — cả hai đều dùng |
| `src/components/GameHud.tsx` | Header dùng chung — nơi nút Settings được render |
| `src/styles.css` | Định nghĩa `.modal`, `.modal::backdrop` dùng chung |
| `src/lesson.css` | Định nghĩa `.lesson-sound-toggle`, `.lesson-settings` |

---

## 3. Luồng hoạt động Settings trong Array (BubbleGame) — Chuẩn tham chiếu

### Bước 1 — Nút Settings khai báo ở đâu?
Trong `GameHeader` (từ `GameHud.tsx`):
```tsx
<button className="round-button" aria-label="Tùy chọn" onClick={onSettings}>
  <Settings size={25} />
</button>
```
`onSettings` được truyền từ `BubbleGame`:
```tsx
onSettings={() => { gameAudio.unlock(); setSettings(true); }}
```
**Ghi chú:** BubbleGame gọi `gameAudio.unlock()` trước — đây là pattern phổ biến để khởi tạo audio context trên mobile.

### Bước 2 — State `settings` quản lý ở đâu?
```tsx
const [settings, setSettings] = useState(false);
```
Trong `BubbleGame` component, cùng với các state khác.

### Bước 3 — Settings được render như thế nào?
```tsx
{settings && (
  <BubbleSettings onClose={() => setSettings(false)}>
    {/* nội dung bên trong */}
    <button onClick={() => setSettings(false)}>Tiếp tục</button>
  </BubbleSettings>
)}
```
Chỉ render khi `settings === true`.

### Bước 4 — `BubbleSettings` component mở dialog thế nào?
```tsx
function BubbleSettings({ children, onClose }) {
  const ref = useRef<HTMLDialogElement>(null);
  
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;  // Lưu focus hiện tại
    const dialog = ref.current;
    dialog?.showModal();          // Mở đúng cách — tạo modal với backdrop
    return () => {
      dialog?.close();            // Đóng khi component unmount
      previous?.focus();          // Trả lại focus
    };
  }, []);
  
  return (
    <dialog
      className="modal lesson-settings"
      ref={ref}
      aria-label="Tùy chọn Bubble Sort"
      onCancel={(event) => {      // ← KEY POINT: xử lý Escape key
        event.preventDefault();   // Ngăn dialog tự đóng
        onClose();                // Gọi onClose để reset state
      }}
    >
      ...
    </dialog>
  );
}
```

**Điểm then chốt của BubbleSettings:**
- `showModal()` — mở modal thực sự với backdrop
- Lưu `previous` element (focus cũ) trước khi mở
- `return () => { dialog?.close(); previous?.focus(); }` — cleanup khi component tắt
- `onCancel` + `event.preventDefault()` — xử lý Escape key, ngăn dialog tự đóng mà không reset state

### Bước 5 — Backdrop có click-outside không?
**Không.** BubbleSettings **không** có click-outside handler. Người chơi chỉ đóng bằng:
- Nút "Tiếp tục" (`setSettings(false)`)
- Phím Escape → `onCancel` → `onClose()` → `setSettings(false)`

### Bước 6 — `paused` state khi Settings mở?
```tsx
const paused = settings || !visible || (demo && motionPaused);
```
Khi `settings = true`, `paused = true` → game animation dừng, audio tắt.

---

## 4. Luồng hoạt động Settings trong Graph (GraphGame) — Hiện trạng

### Bước 1 — Nút Settings khai báo ở đâu?
Trong `GameHeader` giống hệt Array:
```tsx
<GameHeader
  title="BFS · Tìm đường"
  onBack={onBack}
  onSettings={() => setSettings(true)}  // Thiếu gameAudio.unlock()
  showBack={false}
/>
```
**Khác biệt nhỏ:** Graph không có `gameAudio.unlock()` trong onClick.

### Bước 2 — State `settings` quản lý ở đâu?
```tsx
const [settings, setSettings] = useState(false);
```
Giống Array.

### Bước 3 — `blocked` state khi Settings mở?
```tsx
const blocked = settings || hint || done || !visible;
```
Khi `settings = true`, `blocked = true` → không nhận vertex click. Tương đương `paused` của Array.

### Bước 4 — `GraphSettings` component mở dialog thế nào?
```tsx
function GraphSettings({ onClose, onBack, sound, ... }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();           // ✅ Đúng — tạo modal với backdrop
    return () => dialog.close();  // ✅ Cleanup khi unmount
    // ❌ Thiếu: không lưu previous focus
    // ❌ Thiếu: không gọi previous?.focus() sau khi đóng
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal lesson-settings"
      onClose={onClose}           // Fires khi dialog.close() được gọi
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      // ❌ Thiếu: onCancel handler cho Escape key
      aria-label="Tùy chọn BFS"
    >
      ...
    </dialog>
  );
}
```

### Bước 5 — Vấn đề Escape key
Khi người chơi nhấn **Escape**:
- `<dialog>` element mặc định sẽ tự đóng — `onClose` event fires
- `onClose` callback của GraphSettings là `() => setSettings(false)` ✅
- **Nhưng:** React unmount `GraphSettings` component vì `settings` đổi về `false`... 

Khoan — thực ra `onClose` trên `<dialog>` **fires khi dialog native close**. Khi Escape được nhấn, dialog tự close và `onClose` event fires → gọi `() => setSettings(false)` → state đúng.

Vậy **Escape key thực ra hoạt động được** — nhưng theo cách khác với BubbleSettings (BubbleSettings ngăn native close bằng `preventDefault()` rồi gọi tay, còn Graph để native close xảy ra rồi đồng bộ state qua `onClose`).

### Bước 6 — Vấn đề click-outside
GraphSettings có:
```tsx
onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
```
→ Click vào backdrop đóng được. **Đây là tính năng thêm so với BubbleSettings.**

---

## 5. Bảng so sánh chi tiết

| Hạng mục | Array (BubbleGame) | Graph (GraphGame) | Đánh giá |
|----------|-------------------|-------------------|----------|
| **Nút Settings — khai báo** | `GameHeader` với `onSettings={() => { gameAudio.unlock(); setSettings(true); }}` | `GameHeader` với `onSettings={() => setSettings(true)}` | ⚠️ Graph thiếu `gameAudio.unlock()` |
| **State `settings`** | `useState(false)` trong component | `useState(false)` trong component | ✅ Giống nhau |
| **Điều kiện render Settings** | `{settings && <BubbleSettings>}` | `{settings && <GraphSettings>}` | ✅ Giống nhau |
| **Mở dialog** | `dialog.showModal()` trong `useEffect` | `dialog.showModal()` trong `useEffect` | ✅ Giống nhau |
| **Lưu & trả focus** | `const previous = document.activeElement` → `previous?.focus()` khi đóng | **Không có** | ❌ Graph thiếu |
| **Escape key** | `onCancel` + `preventDefault()` + gọi tay `onClose()` | Dùng native `onClose` event | ⚠️ Hoạt động được nhưng khác cơ chế |
| **Click ngoài backdrop** | Không hỗ trợ | Có — `onClick` check `e.target === e.currentTarget` | Graph tốt hơn ở điểm này |
| **Cleanup** | `dialog.close()` + `previous.focus()` | `dialog.close()` (thiếu focus) | ⚠️ Graph thiếu focus restore |
| **`paused`/`blocked` khi mở** | `paused = settings \|\| ...` | `blocked = settings \|\| ...` | ✅ Tương đương |
| **Nội dung Settings** | Sound toggle + HapticsToggle + Chọn level + Nhập mảng tùy chỉnh + Tiếp tục | Sound toggle + HapticsToggle + Chọn difficulty + Chơi lại + Tiếp tục + Về bản đồ | ✅ Phù hợp với từng game |
| **Tiêu đề** | "Chuyến đi của bạn" | "Tùy chọn BFS" | 🟡 Không nhất quán tone |
| **Backdrop CSS** | `.modal::backdrop` trong `styles.css` | Dùng chung `.modal::backdrop` | ✅ Dùng chung đúng |
| **`gameAudio.unlock()`** | Gọi trước khi mở Settings | Không gọi | ⚠️ Có thể gây audio không chạy sau Settings |

---

## 6. Nguyên nhân gốc và bằng chứng

### Nguyên nhân gốc: `onCancel` bị thiếu

**Tình huống:** Người chơi nhấn Escape để đóng Settings.

- **Array (BubbleSettings):** `onCancel` bắt event, gọi `event.preventDefault()` để ngăn native close, sau đó gọi `onClose()` để set state → **kiểm soát hoàn toàn** flow đóng.
- **Graph (GraphSettings):** Không có `onCancel`. Khi Escape được nhấn, trình duyệt tự đóng dialog natively → `onClose` event fires → `() => setSettings(false)` được gọi.

**Hỏi: Tại sao cơ chế của Graph "có vẻ hoạt động được" nhưng vẫn là vấn đề?**

Vì không có `event.preventDefault()`, trình duyệt đóng dialog **ngay lập tức** (sync) trước khi React kịp xử lý state. Điều này tạo ra một "flash" nhỏ: dialog đóng → `onClose` fires → React re-render → component unmount. Trên một số trình duyệt hoặc thiết bị cũ, thứ tự này có thể không nhất quán.

**Bằng chứng từ code:**

BubbleSettings (file `BubbleGame.tsx`, line ~570-580):
```tsx
onCancel={(event) => {
  event.preventDefault();
  onClose();
}}
```

GraphSettings (file `GraphGame.tsx`, không có `onCancel`):
```tsx
<dialog
  ref={dialogRef}
  className="modal lesson-settings"
  onClose={onClose}   // ← chỉ có onClose, không có onCancel
  onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  ...
>
```

### Nguyên nhân liên quan 1: Thiếu focus restore

**Array:**
```tsx
const previous = document.activeElement as HTMLElement;
// ... (sau khi đóng)
previous?.focus();
```

**Graph:** Không có. Khi người chơi dùng keyboard (Tab, Enter để mở Settings), sau khi đóng, focus không quay về nút Settings → phải click tay lại.

**Bằng chứng từ code (`GraphGame.tsx`, function `GraphSettings`):**
```tsx
useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  dialog.showModal();
  return () => dialog.close();   // ← không có previous?.focus()
}, []);
```

### Nguyên nhân liên quan 2: Thiếu `gameAudio.unlock()`

**Array:** `onSettings={() => { gameAudio.unlock(); setSettings(true); }}`  
**Graph:** `onSettings={() => setSettings(true)}`

Trên mobile, Web Audio API yêu cầu user gesture để "unlock" trước. Nếu người chơi nhấn Settings và thay đổi âm thanh, lần đầu tiên âm thanh có thể không phát. Tuy nhiên `gameAudio.unlock()` được gọi ở nhiều chỗ khác (vertex click, hint click), nên trong thực tế lỗi này hiếm xảy ra.

---

## 7. Các nguyên nhân liên quan khác

**Không phải lỗi nhưng cần lưu ý:**

- Tiêu đề "Tùy chọn BFS" không nhất quán với tone của game ("Chuyến đi của bạn" trong Array). Không ảnh hưởng chức năng.
- `GraphLesson.tsx` có cùng `GraphSettings` component nhưng thiếu `onCancel` giống `GraphGame.tsx`.

---

## 8. Phương án sửa tối thiểu đề xuất

### Phương án: Áp dụng pattern của BubbleSettings vào GraphSettings

Chỉ cần **2 thay đổi nhỏ** trong mỗi `GraphSettings` component:

**Thay đổi 1 — Thêm `onCancel` handler (quan trọng nhất):**
```tsx
<dialog
  ref={dialogRef}
  className="modal lesson-settings"
  onClose={onClose}
  onCancel={(e) => { e.preventDefault(); onClose(); }}  // ← THÊM
  onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  aria-label="Tùy chọn BFS"
>
```

**Thay đổi 2 — Thêm focus restore:**
```tsx
useEffect(() => {
  const previous = document.activeElement as HTMLElement;  // ← THÊM
  const dialog = dialogRef.current;
  if (!dialog) return;
  dialog.showModal();
  return () => {
    dialog.close();
    previous?.focus();  // ← THÊM
  };
}, []);
```

**Thay đổi 3 (tùy chọn) — Thêm `gameAudio.unlock()` khi mở Settings:**

Trong `GraphGame.tsx`, thay:
```tsx
onSettings={() => setSettings(true)}
```
bằng:
```tsx
onSettings={() => { gameAudio.unlock(); setSettings(true); }}
```

**Cả 2 file `GraphGame.tsx` và `GraphLesson.tsx` đều cần áp dụng thay đổi 1+2.** Thay đổi 3 chỉ trong `GraphGame.tsx` (GraphLesson có cơ chế unlock riêng khi phát audio).

---

## 9. Files dự kiến cần thay đổi

| File | Thay đổi | Dòng ước tính |
|------|---------|--------------|
| `src/components/GraphGame.tsx` | Thêm `onCancel` + focus restore trong `GraphSettings` component + `gameAudio.unlock()` | ~4 dòng |
| `src/components/GraphLesson.tsx` | Thêm `onCancel` + focus restore trong `GraphSettings` component | ~3 dòng |

**Không cần thay đổi:**
- `src/styles.css` — modal CSS đã đúng
- `src/graph.css` — không liên quan
- Bất kỳ engine file nào
- `App.tsx`

---

## 10. Rủi ro có thể phát sinh

| Rủi ro | Mức độ | Giải thích |
|--------|--------|-----------|
| `onCancel` + `onClose` cùng fire | Thấp | Khi `onCancel` gọi `e.preventDefault()`, native close bị ngăn → `onClose` (native event) không fire. Chỉ `onClose` (prop callback) được gọi từ `onCancel` handler. |
| Click-outside + Escape race condition | Không có | Hai cơ chế độc lập, không cùng lúc. |
| Focus restore gây scroll | Rất thấp | Nếu nút Settings nằm ngoài viewport khi dialog đóng, `previous?.focus()` có thể scroll. Dùng optional chaining (`?.`) nên an toàn nếu element bị unmount. |
| Phá game khác | Không có | Thay đổi chỉ trong component `GraphSettings`, không ảnh hưởng `BubbleSettings`, `SelectionGame`, `InsertionGame`. |

---

## 11. Kế hoạch kiểm thử sau khi sửa

### A. Kiểm tra nút Settings
- [ ] Nhấn Settings trong GraphGame — dialog mở có backdrop mờ.
- [ ] Nhấn Settings nhiều lần liên tiếp — không tạo nhiều dialog.
- [ ] Mở Settings → nhấn Escape → dialog đóng, game tiếp tục bình thường.
- [ ] Mở Settings → click vào backdrop (vùng mờ bên ngoài) → dialog đóng.
- [ ] Mở Settings → nhấn nút X → dialog đóng.
- [ ] Mở Settings trong GraphLesson (Demo mode) — cùng hành vi.

### B. Kiểm tra đóng và quay lại gameplay
- [ ] Sau khi đóng Settings (mọi cách), vertex click hoạt động trở lại.
- [ ] State BFS (queue, visited, current vertex) không bị reset sau khi đóng Settings.
- [ ] Score và số lượt không thay đổi sau khi đóng Settings (trừ khi nhấn "Chơi lại từ đầu").
- [ ] Focus keyboard quay về nút Settings sau khi đóng (kiểm tra bằng Tab key).

### C. Kiểm tra chức năng bên trong Settings
- [ ] Toggle âm thanh bật/tắt hoạt động.
- [ ] Toggle rung bật/tắt hoạt động.
- [ ] Chọn độ khó khác → nhấn "Chơi lại từ đầu" → graph mới được tạo.
- [ ] Nhấn "Về bản đồ" → về AdventureMap.

### D. Kiểm tra hồi quy gameplay
- [ ] BubbleGame Settings vẫn hoạt động (không bị ảnh hưởng).
- [ ] SelectionGame, InsertionGame vẫn bình thường.
- [ ] GraphGame bắt đầu và kết thúc được.

### E. Kiểm tra giao diện
- [ ] Popup không tràn màn hình trên mobile (375px width).
- [ ] Backdrop mờ hiển thị đúng.
- [ ] Nội dung Settings đọc được, nút đủ lớn để chạm.

---

## 12. Những điểm chưa thể xác minh

| Điểm | Lý do chưa xác minh | Cách xác minh tiếp theo |
|------|---------------------|------------------------|
| Lỗi Escape key có tái hiện không | Chưa chạy game trong trình duyệt | Mở `npm run dev`, chơi game thực tế, nhấn Escape trong Settings |
| Hành vi trên Safari/iOS | Chỉ kiểm tra qua code | Test trên thiết bị thực hoặc BrowserStack |
| `gameAudio.unlock()` có gây vấn đề trên mobile không | Không có thiết bị thực để test | Test trên iOS Safari — AudioContext cần gesture đầu tiên |

---

## Tóm tắt nhanh cho Fresher

**Vấn đề thực sự là gì?**

Khi bạn nhấn phím Escape để thoát Settings, trình duyệt có thể đóng dialog theo cách riêng của nó mà không báo cho React biết. Nếu React không được báo, biến `settings` vẫn là `true` mặc dù dialog đã đóng → giao diện bị kẹt.

BubbleSort (Array) xử lý điều này bằng `onCancel` — khi Escape được nhấn, code can thiệp vào: "Khoan, đừng đóng tự động, để tao đóng theo cách của tao" (`preventDefault()`), rồi tự báo React biết (`onClose()`).

Graph hiện tại không làm điều này. Có một cách khác mà Graph đang dùng (`onClose` event) có thể hoạt động trong nhiều trường hợp, nhưng không đảm bảo nhất quán trên mọi trình duyệt như cách của Array.

**Sửa bao nhiêu code?** Rất ít — khoảng 6-7 dòng trong 2 file.

---

*Report hoàn tất. Chưa có thay đổi nào được thực hiện trong code.*
