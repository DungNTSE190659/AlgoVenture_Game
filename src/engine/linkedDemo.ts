import type { LinkedTrackId } from "./linkedCurriculum";

export type LinkedDemoFrame = {
  values: number[];
  focus?: number;
  link?: number;
  muted?: number;
  note: string;
};

export const LINKED_DEMOS: Record<Exclude<LinkedTrackId, "linked-list">, LinkedDemoFrame[]> = {
  "linked-traversal": [
    { values: [5, 1, 8, 3], note: "Danh sách bắt đầu ở HEAD. Muốn tới nút kế tiếp, ta đi theo con trỏ next." },
    { values: [5, 1, 8, 3], focus: 0, note: "Đặt con trỏ current tại HEAD: nút 5." },
    { values: [5, 1, 8, 3], focus: 0, link: 0, note: "Đọc next của 5. Sợi dây dẫn tới nút 1." },
    { values: [5, 1, 8, 3], focus: 1, note: "Di chuyển current sang nút 1." },
    { values: [5, 1, 8, 3], focus: 1, link: 1, note: "Theo next của 1 để tìm nút tiếp theo." },
    { values: [5, 1, 8, 3], focus: 2, note: "Current đã tới nút 8." },
    { values: [5, 1, 8, 3], focus: 2, link: 2, note: "Theo next của 8 tới nút cuối." },
    { values: [5, 1, 8, 3], focus: 3, note: "Current ở nút 3. next của 3 là NULL, nên ta dừng tại đây." },
  ],
  "linked-search": [
    { values: [4, 9, 2, 7], note: "Tìm giá trị 9 bằng cách đi lần lượt từ HEAD." },
    { values: [4, 9, 2, 7], focus: 0, note: "So sánh nút HEAD 4 với giá trị cần tìm 9." },
    { values: [4, 9, 2, 7], focus: 0, note: "4 khác 9. Không thể nhảy thẳng tới nút khác." },
    { values: [4, 9, 2, 7], focus: 0, link: 0, note: "Theo next của 4 để đến nút tiếp theo." },
    { values: [4, 9, 2, 7], focus: 1, note: "So sánh nút 9 với giá trị cần tìm." },
    { values: [4, 9, 2, 7], focus: 1, note: "Đã tìm thấy 9 ở vị trí 1, tính từ 0." },
  ],
  "linked-insertion": [
    { values: [8, 3, 6], note: "Ta sẽ chèn nút mới 5 giữa nút 3 và nút 6." },
    { values: [8, 3, 6], focus: 0, note: "Bắt đầu từ HEAD 8, đi theo next để tìm nút đứng trước chỗ chèn." },
    { values: [8, 3, 6], focus: 1, note: "Đã tới nút 3. Giữ lại nút 6 đang đứng phía sau." },
    { values: [8, 3, 5, 6], focus: 2, muted: 1, note: "Đưa nút mới 5 vào giữa 3 và 6; chưa đổi liên kết của 3." },
    { values: [8, 3, 5, 6], focus: 2, link: 2, muted: 1, note: "Nối next của nút mới 5 tới nút 6 trước để không mất phần sau." },
    { values: [8, 3, 5, 6], focus: 1, link: 1, note: "Đổi next của nút 3 sang nút 5. Danh sách trở thành 8 → 3 → 5 → 6." },
  ],
  "linked-deletion": [
    { values: [8, 3, 6], note: "Ta sẽ xóa nút 3 ở giữa danh sách." },
    { values: [8, 3, 6], focus: 0, note: "Tìm nút đứng trước nút cần xóa: đó là nút 8." },
    { values: [8, 3, 6], focus: 1, note: "Nút 3 cần xóa đang trỏ tới nút 6. Ta phải giữ lại nút 6." },
    { values: [8, 3, 6], focus: 0, muted: 1, note: "Chuẩn bị đổi next của 8 để bỏ qua nút 3." },
    { values: [8, 3, 6], focus: 0, link: 0, muted: 1, note: "Nối trực tiếp 8 tới 6. Nút 3 đã tách khỏi đường đi từ HEAD." },
    { values: [8, 6], focus: 0, link: 0, note: "Bỏ nút 3 khỏi hàng lắp. Danh sách còn 8 → 6 → NULL." },
  ],
  "linked-reversal": [
    { values: [7, 2, 9, 4], note: "Đảo ngược danh sách 7 → 2 → 9 → 4 bằng cách đổi từng con trỏ next." },
    { values: [7, 2, 9, 4], focus: 0, note: "Giữ nút 7 làm current. Nút 7 sẽ trở thành TAIL, next của nó là NULL." },
    { values: [7, 2, 9, 4], focus: 1, link: 0, note: "Lưu nút kế tiếp, rồi đổi next của 2 trỏ ngược về 7." },
    { values: [7, 2, 9, 4], focus: 2, link: 1, note: "Tiếp tục đổi next của 9 trỏ ngược về 2." },
    { values: [7, 2, 9, 4], focus: 3, link: 2, note: "Đổi next của 4 trỏ ngược về 9." },
    { values: [4, 9, 2, 7], focus: 0, note: "Nút 4 là HEAD mới; các liên kết đi 4 → 9 → 2 → 7 → NULL." },
  ],
};
