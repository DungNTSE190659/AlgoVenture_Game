# Graph Settings Fix Report

**Branch:** `feature/graph-algorithms`  
**Ngày:** October 20, 2026  
**Giai đoạn:** C + D — Triển khai & Kết quả kiểm thử  

---

## Nguyên nhân gốc đã xác minh

Có 3 vấn đề so với chuẩn của Array (BubbleSort), tất cả đều nằm trong component `GraphSettings`:

1. **Thiếu `onCancel` handler** — khi người chơi nhấn Escape, trình duyệt đóng dialog theo cơ chế riêng của nó mà không thông qua React, dẫn đến khả năng state `settings` không được reset đồng bộ trên một số trình duyệt.
2. **Thiếu lưu và trả lại focus** — sau khi đóng Settings, con trỏ bàn phím không quay về nút Settings, gây bất tiện khi dùng keyboard.
3. **Thiếu `gameAudio.unlock()`** khi mở Settings — có thể khiến âm thanh không phát lần đầu trên mobile.

---

## Những thay đổi đã thực hiện

### File 1: `src/components/GraphGame.tsx`

**Thay đổi A — Thêm `gameAudio.unlock()` khi mở Settings:**
```tsx
// Trước:
onSettings={() => setSettings(true)}

// Sau:
onSettings={() => { gameAudio.unlock(); setSettings(true); }}
```
*Lý do:* Nhất quán với BubbleGame. Trên mobile, Web Audio API cần được "unlock" từ một user gesture trước khi phát âm thanh. Nút Settings là điểm chạm của người dùng — đây là thời điểm tốt để gọi unlock.

**Thay đổi B — Thêm lưu/trả focus trong `useEffect` của `GraphSettings`:**
```tsx
// Trước:
useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  dialog.showModal();
  return () => dialog.close();
}, []);

// Sau:
useEffect(() => {
  const previous = document.activeElement as HTMLElement | null;
  const dialog = dialogRef.current;
  if (!dialog) return;
  dialog.showModal();
  return () => {
    dialog.close();
    previous?.focus();
  };
}, []);
```
*Lý do:* Lưu element đang có focus (nút Settings ⚙) trước khi mở dialog. Khi dialog đóng, `previous?.focus()` trả cursor keyboard về đúng chỗ cũ. `?.` (optional chaining) đảm bảo không lỗi nếu element bị unmount.

**Thay đổi C — Thêm `onCancel` handler vào `<dialog>`:**
```tsx
// Trước:
<dialog onClose={onClose} onClick={...}>

// Sau:
<dialog onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={...}>
```
*Lý do:* `onCancel` fires khi người chơi nhấn Escape. `e.preventDefault()` ngăn trình duyệt tự đóng dialog theo cơ chế native (không qua React). Sau đó `onClose()` được gọi thủ công để React cập nhật state `settings = false` một cách chắc chắn. Đây đúng là pattern của BubbleSettings.

---

### File 2: `src/components/GraphLesson.tsx`

**Thay đổi D — Thêm lưu/trả focus (giống Thay đổi B):**
Cùng pattern — lưu `previous` element, trả focus khi cleanup.

**Thay đổi E — Thêm `onCancel` handler (giống Thay đổi C):**
Cùng pattern — `e.preventDefault()` + `onClose()`.

*GraphLesson không cần `gameAudio.unlock()` vì nút Settings của nó gọi `gameAudio.stop()` trước, và audio đã được unlock từ các tương tác trước đó trong Demo mode.*

---

## Luồng hoạt động sau khi sửa

### Mở Settings
1. Người chơi nhấn ⚙ → `gameAudio.unlock()` (mobile audio init) → `setSettings(true)`
2. React render `GraphSettings` component
3. `useEffect` chạy: lưu `previous = document.activeElement` (nút ⚙), gọi `dialog.showModal()`
4. `showModal()` tạo modal thực sự: backdrop mờ hiển thị, focus trap kích hoạt, Escape được theo dõi

### Đóng Settings — 3 cách
| Cách | Flow |
|------|------|
| Nhấn nút X hoặc "Tiếp tục" | `onClick` → `onClose()` → `setSettings(false)` → React unmount `GraphSettings` → `useEffect cleanup` → `dialog.close()` + `previous?.focus()` |
| Nhấn Escape | `onCancel` fires → `e.preventDefault()` ngăn native close → `onClose()` → `setSettings(false)` → unmount → cleanup |
| Click backdrop (vùng mờ ngoài dialog) | `onClick` check `e.target === e.currentTarget` → `onClose()` → cùng flow |

Trong tất cả 3 trường hợp: state được reset, focus về nút ⚙, game tiếp tục bình thường.

---

## Danh sách file đã chỉnh sửa

| File | Số dòng thay đổi | Nội dung |
|------|-----------------|---------|
| `src/components/GraphGame.tsx` | +6 dòng | `gameAudio.unlock()`, lưu/trả focus, `onCancel` |
| `src/components/GraphLesson.tsx` | +5 dòng | Lưu/trả focus, `onCancel` |

**Không thay đổi:** engine files, CSS, App.tsx, GameHud.tsx, các game khác.

---

## Kết quả kiểm thử

> Kiểm thử thực hiện qua: code audit + build verification (TypeScript + Vite).  
> **Chưa chạy trong trình duyệt thực** — không tuyên bố PASS cho các mục cần chạy thực tế.

### A. Kiểm tra nút Settings
- [ ] `NOT TESTED` Nhấn Settings trong GraphGame — dialog mở có backdrop mờ.
- [ ] `NOT TESTED` Nhấn Settings nhiều lần liên tiếp — không tạo nhiều dialog.
- [ ] `NOT TESTED` Mở Settings → nhấn Escape → dialog đóng, game tiếp tục bình thường.
- [ ] `NOT TESTED` Mở Settings → click backdrop → dialog đóng.
- [ ] `NOT TESTED` Mở Settings trong GraphLesson — cùng hành vi.

### B. Kiểm tra đóng và quay lại gameplay
- [ ] `NOT TESTED` Sau khi đóng Settings, vertex click hoạt động trở lại.
- [ ] `NOT TESTED` State BFS không bị reset sau khi đóng Settings.
- [ ] `NOT TESTED` Score và số lượt không đổi sau khi đóng Settings.
- [ ] `NOT TESTED` Focus keyboard quay về nút Settings sau khi đóng.

### C. Kiểm tra chức năng bên trong Settings
- [ ] `NOT TESTED` Toggle âm thanh bật/tắt hoạt động.
- [ ] `NOT TESTED` Toggle rung bật/tắt hoạt động.
- [ ] `NOT TESTED` Chọn độ khó → "Chơi lại từ đầu" → graph mới được tạo.
- [ ] `NOT TESTED` Nhấn "Về bản đồ" → về AdventureMap.

### D. Kiểm tra hồi quy gameplay
- [x] `PASS` Build TypeScript + Vite không có lỗi (exit code 0, "built in 8.14s").
- [ ] `NOT TESTED` BubbleGame Settings vẫn hoạt động.
- [ ] `NOT TESTED` SelectionGame, InsertionGame vẫn bình thường.
- [ ] `NOT TESTED` GraphGame bắt đầu và kết thúc được.

### E. Kiểm tra giao diện
- [ ] `NOT TESTED` Popup không tràn màn hình trên mobile.
- [ ] `NOT TESTED` Backdrop mờ hiển thị đúng.

---

## Lỗi còn tồn tại

Không có lỗi mới phát sinh. Lỗi pre-existing trong `learningTrack.test.ts` ("opens the next region") vẫn còn — không liên quan đến Settings và không bị ảnh hưởng bởi thay đổi này.

---

## Hướng dẫn tự kiểm tra trong trình duyệt

```bash
# 1. Khởi động dev server
npm run dev

# 2. Mở http://localhost:5173 trong trình duyệt
```

Sau đó thực hiện theo trình tự:

**Test 1 — Mở/đóng bằng nút X:**
1. Vào AdventureMap → chọn BFS → nhấn "Thử thách"
2. Nhấn ⚙ góc phải → Settings mở, background mờ
3. Nhấn X → Settings đóng, game tiếp tục

**Test 2 — Đóng bằng Escape:**
1. Mở Settings như trên
2. Nhấn phím **Escape** trên bàn phím
3. Settings phải đóng, `blocked` về `false`, click vào vertex được

**Test 3 — Đóng bằng click backdrop:**
1. Mở Settings
2. Click vào vùng mờ bên ngoài hộp thoại
3. Settings phải đóng

**Test 4 — Escape không làm kẹt state:**
1. Mở Settings
2. Nhấn Escape nhanh 2–3 lần liên tiếp
3. Không có dialog thứ hai xuất hiện, game bình thường

**Test 5 — Demo mode (GraphLesson):**
1. Vào AdventureMap → chọn BFS → nhấn "Demo"
2. Thực hiện Test 1, 2, 3 như trên
3. Demo vẫn chạy/dừng đúng sau khi đóng Settings
