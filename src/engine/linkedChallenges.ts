import type { LinkedLevel, LinkedTrackId } from "./linkedCurriculum";

export type LinkedQuestion = { prompt: string; choices: readonly [string, string, string]; answer: string; why: string };
export type LinkedChallenge = { title: string; instruction: string; before: readonly number[]; after: readonly number[]; questions: readonly [LinkedQuestion, LinkedQuestion] };
const q = (prompt: string, choices: [string, string, string], answer: string, why: string): LinkedQuestion => ({ prompt, choices, answer, why });

export const LINKED_CHALLENGES: Record<Exclude<LinkedTrackId, "linked-list">, readonly [LinkedChallenge, LinkedChallenge, LinkedChallenge]> = {
  "linked-traversal": [
    { title: "Đi từng nút", instruction: "Đi từ HEAD đến NULL bằng con trỏ next.", before: [8, 3, 6], after: [8, 3, 6], questions: [q("Bắt đầu duyệt tại nút nào?", ["8 (HEAD)", "3", "6"], "8 (HEAD)", "Duyệt danh sách luôn bắt đầu từ HEAD."), q("Sau nút 8, con trỏ next đưa ta tới đâu?", ["NULL", "3", "6"], "3", "Theo liên kết 8 → 3, ta đến nút 3.")] },
    { title: "Đếm số nút", instruction: "Mỗi lần ghé một nút, tăng bộ đếm lên một.", before: [4, 9, 2, 7], after: [4, 9, 2, 7], questions: [q("Sau khi đi qua 4 → 9 → 2, đã đếm được bao nhiêu nút?", ["2", "3", "4"], "3", "Ba nút 4, 9 và 2 đã được thăm."), q("Khi con trỏ tới NULL, tổng số nút là bao nhiêu?", ["3", "4", "5"], "4", "Có bốn nút trước NULL.")] },
    { title: "Tới nút cuối", instruction: "Theo next cho đến khi next của nút hiện tại là NULL.", before: [5, 1, 8, 3], after: [5, 1, 8, 3], questions: [q("Từ HEAD 5, đi theo next hai lần sẽ ở nút nào?", ["1", "8", "3"], "8", "Lần một đến 1; lần hai đến 8."), q("Nút nào là TAIL vì next của nó bằng NULL?", ["5", "8", "3"], "3", "Nút 3 đứng cuối, không nối đến nút khác.")] },
  ],
  "linked-search": [
    { title: "Tìm giá trị", instruction: "Tìm số 6 bằng cách duyệt tuần tự.", before: [8, 3, 6], after: [8, 3, 6], questions: [q("So sánh đầu tiên với nút nào?", ["8 (HEAD)", "3", "6"], "8 (HEAD)", "Danh sách liên kết không truy cập ngẫu nhiên; ta bắt đầu tại HEAD."), q("Sau 8 và 3, tìm thấy 6 ở nút thứ mấy?", ["1", "2", "3"], "3", "Đi theo next lần lượt qua 8, 3 rồi 6.")] },
    { title: "Tìm vị trí", instruction: "Tìm vị trí của giá trị 9, đánh số từ 0.", before: [4, 9, 2, 7], after: [4, 9, 2, 7], questions: [q("Nút HEAD 4 có chỉ số nào?", ["0", "1", "4"], "0", "Chỉ số bắt đầu từ 0."), q("Giá trị 9 nằm ở chỉ số nào?", ["0", "1", "2"], "1", "Nút 9 đứng ngay sau HEAD, ở chỉ số 1.")] },
    { title: "Không tìm thấy", instruction: "Tìm số 5 trong danh sách.", before: [2, 4, 8], after: [2, 4, 8], questions: [q("Sau khi kiểm tra 2 rồi 4, nút nào cần kiểm tra tiếp?", ["8", "2", "NULL"], "8", "Cần kiểm tra hết các nút trước khi kết luận."), q("Sau nút 8 mà chưa gặp 5, kết quả là gì?", ["Ở nút 8", "Không tìm thấy", "Quay về HEAD"], "Không tìm thấy", "Con trỏ đã đến NULL mà không gặp giá trị 5.")] },
  ],
  "linked-insertion": [
    { title: "Chèn ở đầu", instruction: "Chèn nút 2 trước HEAD hiện tại.", before: [8, 3, 6], after: [2, 8, 3, 6], questions: [q("next của nút mới 2 cần trỏ đến đâu?", ["8 (HEAD cũ)", "3", "NULL"], "8 (HEAD cũ)", "Nút mới nối đến HEAD cũ để giữ nguyên phần còn lại."), q("Sau khi nối, HEAD mới là nút nào?", ["8", "2", "3"], "2", "Cập nhật HEAD trỏ đến nút vừa thêm.")] },
    { title: "Chèn ở giữa", instruction: "Chèn nút 5 giữa 3 và 6.", before: [8, 3, 6], after: [8, 3, 5, 6], questions: [q("Trước tiên, next của nút mới 5 trỏ đến đâu?", ["3", "6", "NULL"], "6", "Giữ nút phía sau bằng cách cho 5 → 6 trước."), q("Sau đó đổi next của nút nào để trỏ tới 5?", ["8", "3", "6"], "3", "Nút đứng trước vị trí chèn là 3; đổi liên kết 3 → 5.")] },
    { title: "Chèn ở cuối", instruction: "Chèn nút 9 sau TAIL hiện tại.", before: [8, 3, 6], after: [8, 3, 6, 9], questions: [q("Nút cuối hiện tại là nút nào?", ["8", "3", "6"], "6", "Nút 6 có next bằng NULL nên là TAIL."), q("Sau khi nối 6 → 9, next của nút 9 là gì?", ["8", "6", "NULL"], "NULL", "Nút 9 trở thành TAIL mới.")] },
  ],
  "linked-deletion": [
    { title: "Xóa ở đầu", instruction: "Xóa HEAD 8 mà vẫn giữ phần còn lại.", before: [8, 3, 6], after: [3, 6], questions: [q("HEAD mới phải trỏ tới nút nào?", ["8", "3", "6"], "3", "HEAD mới là next của HEAD cũ."), q("Sau khi bỏ nút 8, chuỗi còn lại là gì?", ["3 → 6", "8 → 6", "Chỉ còn 6"], "3 → 6", "Liên kết 3 → 6 vẫn được giữ.")] },
    { title: "Xóa ở giữa", instruction: "Xóa nút 3 trong 8 → 3 → 6.", before: [8, 3, 6], after: [8, 6], questions: [q("Nút đứng ngay trước nút cần xóa là nút nào?", ["8", "3", "6"], "8", "Nút 8 đang nối tới 3."), q("Để bỏ qua 3, next của 8 phải trỏ tới đâu?", ["3", "6", "NULL"], "6", "Nối 8 → 6 để chuỗi vẫn liền mạch.")] },
    { title: "Xóa ở cuối", instruction: "Xóa TAIL 6 trong 8 → 3 → 6.", before: [8, 3, 6], after: [8, 3], questions: [q("Nút đứng trước TAIL 6 là nút nào?", ["8", "3", "6"], "3", "Nút 3 đang nối tới TAIL 6."), q("Sau khi xóa 6, next của nút 3 là gì?", ["8", "6", "NULL"], "NULL", "Nút 3 trở thành TAIL mới.")] },
  ],
  "linked-reversal": [
    { title: "Đảo 2 nút", instruction: "Đảo chiều 8 → 3 bằng cách đổi hướng liên kết.", before: [8, 3], after: [3, 8], questions: [q("Sau khi đảo, next của nút 3 trỏ tới đâu?", ["8", "3", "NULL"], "8", "Liên kết mới đi ngược từ 3 về 8."), q("HEAD mới là nút nào?", ["8", "3", "NULL"], "3", "Nút cuối cũ trở thành HEAD mới.")] },
    { title: "Đảo 3 nút", instruction: "Đảo 8 → 3 → 6 thành 6 → 3 → 8.", before: [8, 3, 6], after: [6, 3, 8], questions: [q("next của HEAD cũ 8 phải trở thành gì?", ["3", "6", "NULL"], "NULL", "HEAD cũ sẽ là TAIL mới."), q("Sau khi đảo, next của 6 trỏ tới đâu?", ["8", "3", "NULL"], "3", "Chuỗi đảo ngược bắt đầu bằng 6 → 3.")] },
    { title: "Đảo 4 nút", instruction: "Đảo 7 → 2 → 9 → 4.", before: [7, 2, 9, 4], after: [4, 9, 2, 7], questions: [q("Nút nào trở thành HEAD mới?", ["7", "9", "4"], "4", "TAIL cũ trở thành HEAD mới."), q("Trong chuỗi mới, next của 9 trỏ tới đâu?", ["7", "2", "4"], "2", "Các liên kết mới là 4 → 9 → 2 → 7.")] },
  ],
};

export function linkedChallenge(id: Exclude<LinkedTrackId, "linked-list">, level: LinkedLevel): LinkedChallenge {
  return LINKED_CHALLENGES[id][level - 1];
}
