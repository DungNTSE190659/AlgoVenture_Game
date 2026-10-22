type DemoState = {
  slots: (number | null)[];
  links: Record<number, number | null>;
  head: number | null;
  cursor: number | null;
  nullDock: number | null;
  phase: string;
  held: { kind: "node" | "link" | "pig"; value: number } | null;
};
type DemoAction = { kind: string; held?: { kind: "node" | "link" | "pig"; value: number }; index?: number; value?: number | null };
type Context = { algorithm: string; before: number[]; after: number[]; added: number; removed: number; searchValue: number };

/** Explain the action that produced this frame, including its actual values. */
export function linkedNarration(previous: DemoState, current: DemoState, action: DemoAction | undefined, context: Context): string {
  const { algorithm, before, after, added, removed, searchValue } = context;
  if (!action) {
    if (algorithm === "linked-reversal") return `Mình sẽ đảo ${before.join(" → ")} thành ${after.join(" → ")}. Trước tiên, tháo từng đinh để có thể di chuyển các khối.`;
    return `Mình bắt đầu bằng cách lắp ${before.join(" → ")} rồi nối các nút với nhau. ${algorithm === "linked-search" ? `Sau đó, mình sẽ tìm số ${searchValue}.` : algorithm === "linked-insertion" ? `Sau đó, mình sẽ chèn nút ${added}.` : algorithm === "linked-deletion" ? `Sau đó, mình sẽ xóa nút ${removed}.` : "Sau đó, heo sẽ đi từ HEAD đến NULL."}`;
  }
  if (action.kind === "select" && action.held) {
    const { kind, value } = action.held;
    if (kind === "pig") return `Danh sách đã nối xong. Mình cầm heo nhỏ lên để đặt vào nút HEAD là ${current.head}.`;
    if (kind === "link") {
      const old = previous.links[value];
      return old !== null || previous.nullDock === value
        ? `Mình rút đinh của nút ${value} khỏi ${old ?? "NULL"}. Liên kết cũ đã được tháo, nên có thể đổi hướng nối.`
        : `Mình chọn đinh next của nút ${value}. Bước tiếp theo là cắm đinh vào lỗ của nút đứng sau nó.`;
    }
    return previous.slots.includes(value)
      ? `Mình chọn khối ${value} ở hàng lắp. Các dây đã tháo, nên khối có thể được đưa về khay.`
      : `Mình chọn khối ${value} trong khay. ${algorithm === "linked-reversal" ? "Mình sẽ xếp lại theo thứ tự đảo ngược." : "Bây giờ đưa khối vào đúng ô trong danh sách."}`;
  }
  if (action.kind === "slot") {
    const value = previous.held?.value;
    if (previous.phase === "insert") return `Mình đặt nút mới ${value} vào vị trí ${(action.index ?? 0) + 1}. Chưa nối dây vội: trước tiên phải nối next của nút mới để không mất phần danh sách phía sau.`;
    return `Mình đặt khối ${value} vào ${action.index === 0 ? "HEAD, điểm bắt đầu danh sách" : action.index === current.slots.length - 1 ? "TAIL, vị trí cuối danh sách" : `vị trí ${(action.index ?? 0) + 1}`}. ${algorithm === "linked-reversal" ? "Tiếp tục xếp các khối theo thứ tự đảo ngược." : "Đặt xong các khối, mình sẽ nối các đinh next."}`;
  }
  if (action.kind === "bank") return `Mình đưa khối ${previous.held?.value} về khay. ${algorithm === "linked-deletion" ? "Nút này đã được xóa; các nút còn lại vẫn nối liền nhau." : "Ô cũ đã trống, sẵn sàng cho thứ tự mới."}`;
  if (action.kind === "ready") return `Đã lắp ${before.join(" → ")} → NULL. Bây giờ mình bắt đầu duyệt từ HEAD là ${current.head}.`;
  if (action.kind === "target") {
    const target = action.value ?? "NULL";
    if (previous.held?.kind === "pig") return `Heo đã đứng trên HEAD là nút ${target}. Muốn sang nút tiếp theo, mình đi theo dây next của nút hiện tại.`;
    if (previous.held?.kind === "link") return action.value === null
      ? `Mình cắm đinh của nút ${previous.held.value} vào NULL. Đây là nút cuối: sau nó không còn nút nào nữa.`
      : `Mình nối next của ${previous.held.value} tới ${target}. Từ nút ${previous.held.value}, heo sẽ đi theo dây này để tới ${target}.`;
    if (previous.phase === "new-link") return `Mình nối next của nút mới ${added} tới ${target}. Như vậy, nút mới đã giữ được liên kết với phần danh sách phía sau.`;
    if (previous.phase === "previous-link") return previous.head !== current.head
      ? `Mình đổi HEAD sang nút mới ${target}. Danh sách sẽ bắt đầu tại đây.`
      : `Mình đổi dây của nút trước sang ${target}. Nút mới đã được chèn vào danh sách.`;
    if (previous.phase === "delete") return `Mình chọn nút ${removed} cần xóa. Trước khi lấy khối ra, phải nối nút phía trước với nút phía sau.`;
    if (previous.phase === "bypass") return `Mình nối tắt tới ${target}, bỏ qua nút ${removed}. Bây giờ có thể tháo các dây còn lại của nút cần xóa.`;
  }
  if ((action.kind === "next" || action.kind === "target") && algorithm === "linked-deletion" && previous.phase === "walk" && current.phase === "bypass") return `Heo đã tới nút ${removed} cần xóa. Mình tự rút các đinh nối với nút này, nối nút phía trước tới nút phía sau, rồi đưa khối ${removed} về khay.`;
  if (action.kind === "next") return current.cursor === null
    ? `Từ nút ${previous.cursor}, heo đi theo next và tới NULL. ${algorithm === "linked-search" ? `Đã duyệt hết danh sách mà không thấy ${searchValue}.` : "Mình đã đi tới cuối danh sách."}`
    : `Heo đi theo next từ ${previous.cursor} tới ${current.cursor}. ${algorithm === "linked-search" ? current.cursor === searchValue ? `Đúng số ${searchValue} cần tìm! Mình dừng ở đây.` : `${current.cursor} chưa bằng ${searchValue}, nên cần đi tiếp.` : algorithm === "linked-insertion" || algorithm === "linked-deletion" ? "Mình kiểm tra xem đã tới vị trí cần thao tác chưa." : "Đây là nút tiếp theo trong danh sách."}`;
  if (action.kind === "found") return current.cursor === null ? `Không tìm thấy ${searchValue}. Mình đã kiểm tra tất cả các nút trước khi kết luận.` : `Đã tìm thấy ${searchValue} tại nút hiện tại. Mình ghi nhận kết quả rồi kiểm tra lần cuối.`;
  if (action.kind === "edit") return algorithm === "linked-insertion" ? `Đã tới vị trí cần chèn ${added}. Mình lấy nút mới từ khay, đặt vào dấu + rồi cập nhật hai liên kết.` : `Đã tới nút ${removed} cần xóa. Mình sẽ nối tắt qua nút này trước khi đưa nó về khay.`;
  if (action.kind === "check") return `Hoàn thành! ${algorithm === "linked-search" ? before.includes(searchValue) ? `Mình đã tìm thấy ${searchValue}.` : `Mình đã xác nhận ${searchValue} không có trong danh sách.` : algorithm === "linked-traversal" ? `Heo đã duyệt ${before.length} nút và tới NULL.` : `Kết quả là ${after.join(" → ")} → NULL.`}`;
  return "Mình kiểm tra lại liên kết vừa thay đổi trước khi sang bước tiếp theo.";
}
