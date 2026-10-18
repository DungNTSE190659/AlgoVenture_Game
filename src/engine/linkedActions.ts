import type { LinkedTrackId } from "./linkedCurriculum";

export type LinkedAction = {
  kind: "cursor" | "node" | "nail" | "head";
  from?: number;
  to: number | "bank" | "slot" | "null";
  instruction: string;
  result: string;
};

export const LINKED_ACTIONS: Record<Exclude<LinkedTrackId, "linked-list">, LinkedAction[]> = {
  "linked-traversal": [
    { kind: "cursor", to: 0, instruction: "Kéo con trỏ current vào HEAD 5.", result: "Current đang ở nút 5." },
    { kind: "cursor", to: 1, instruction: "Kéo current theo next của 5 tới nút 1.", result: "Đã thăm nút 1." },
    { kind: "cursor", to: 2, instruction: "Đi theo next của 1 tới nút 8.", result: "Đã thăm nút 8." },
    { kind: "cursor", to: 3, instruction: "Đi tiếp tới nút 3, nút có next là NULL.", result: "Nút 3 là TAIL." },
  ],
  "linked-search": [
    { kind: "cursor", to: 0, instruction: "Kéo con trỏ tìm kiếm vào HEAD 4.", result: "4 khác 9; theo next để tìm tiếp." },
    { kind: "cursor", to: 1, instruction: "Kéo con trỏ theo next tới nút 9.", result: "Đã tìm thấy 9 ở vị trí 1." },
  ],
  "linked-insertion": [
    { kind: "node", from: 5, to: "slot", instruction: "Kéo khối 5 từ khay vào chỗ trống giữa 3 và 6.", result: "Nút mới đã ở giữa 3 và 6." },
    { kind: "nail", from: 5, to: 6, instruction: "Kéo đinh của 5 vào lỗ của 6 để giữ phần sau.", result: "Đã nối 5 → 6." },
    { kind: "nail", from: 3, to: 5, instruction: "Kéo đinh của 3 vào lỗ của 5.", result: "Đã nối 3 → 5; chèn nút hoàn tất." },
  ],
  "linked-deletion": [
    { kind: "nail", from: 8, to: 6, instruction: "Kéo đinh của 8 vào lỗ của 6 để bỏ qua nút 3.", result: "Đã nối 8 → 6." },
    { kind: "node", from: 3, to: "bank", instruction: "Kéo khối 3 ra khỏi hàng lắp, về khay.", result: "Đã xóa nút 3; danh sách còn 8 → 6." },
  ],
  "linked-reversal": [
    { kind: "nail", from: 7, to: "null", instruction: "Kéo đinh của 7 tới NULL. Nút đầu cũ sẽ là TAIL mới.", result: "next của 7 đã là NULL." },
    { kind: "nail", from: 2, to: 7, instruction: "Kéo đinh của 2 về lỗ của 7.", result: "Đã đảo liên kết 2 → 7." },
    { kind: "nail", from: 9, to: 2, instruction: "Kéo đinh của 9 về lỗ của 2.", result: "Đã đảo liên kết 9 → 2." },
    { kind: "nail", from: 4, to: 9, instruction: "Kéo đinh của 4 về lỗ của 9.", result: "Đã đảo liên kết 4 → 9." },
    { kind: "head", to: 3, instruction: "Kéo nhãn HEAD sang nút 4.", result: "HEAD mới là 4; danh sách đã đảo ngược." },
  ],
};
