import { cloneBoard, type TreeBoard, type TreeItem, type TreeLessonId, type TreeRound, type TreeStep } from "./tree";

type Context = { lesson: TreeLessonId; round: TreeRound; step: TreeStep; board: TreeBoard; item: TreeItem; target: string };
const parent = (i: number) => Math.floor((i - 1) / 2);
const side = (i: number) => i % 2 ? "trái" : "phải";
function location(b: TreeBoard, slot: number) {
  return b.nodes[slot] !== undefined ? `nút ${b.nodes[slot]}` : slot === 0 ? "ô gốc" : `ô con ${side(slot)} của ${b.nodes[parent(slot)] ?? "nhánh"}`;
}
function ancestryViolation(nodes: TreeBoard["nodes"], slot: number): string | null {
  const value = nodes[slot]; let child = slot;
  while (child > 0) {
    const ancestor = parent(child), limit = nodes[ancestor];
    if (limit !== undefined && (child % 2 ? value >= limit : value <= limit))
      return `${value} nằm trong nhánh ${side(child)} của ${limit} nhưng ${value} ${value === limit ? "=" : value > limit ? ">" : "<"} ${limit}`;
    child = ancestor;
  }
  return null;
}
function plantingReason(b: TreeBoard, value: number, slot: number): string | null {
  // Start at the root so a locally valid comparison cannot hide an ancestor violation.
  const path: number[] = []; let child = slot;
  while (child > 0) { path.unshift(child); child = parent(child); }
  for (const branch of path) {
    const ancestor = parent(branch), pivot = b.nodes[ancestor];
    if (pivot === undefined) return "Ô này chưa có nút cha; trồng ở đây sẽ tạo một nhánh rời khỏi cây.";
    if (value === pivot) return `${value} đã có trong cây; BST này không chứa giá trị trùng.`;
    if ((branch % 2 === 1) !== (value < pivot)) return `${value} ${value < pivot ? "<" : ">"} ${ancestor === 0 ? "gốc " : ""}${pivot}, nên phải ở nhánh ${value < pivot ? "trái" : "phải"} của ${pivot}. Ô bạn chọn thuộc nhánh ${side(branch)} của ${pivot}.`;
  }
  return null;
}
/** Explain the attempted move using its actual source, destination and current invariant. */
export function explainTreeMistake({ lesson, round, step, board: b, item, target }: Context): string {
  const expected = step.items.find(i => i.id === step.item)!;
  const slot = target.startsWith("slot:") ? Number(target.slice(5)) : undefined;
  const expectedSlot = step.target.startsWith("slot:") ? Number(step.target.slice(5)) : undefined;
  const placed = slot === undefined ? target === "tray" ? "khay tháo nút" : "giỏ kết quả" : location(b, slot);
  const attempted = `Bạn đưa ${item.kind === "pig" ? "Buta" : item.kind === "label" ? `nhãn “${item.label}”` : item.label.toLowerCase()} tới ${placed}.`;
  const finish = (reason: string, next: string) => `${attempted} ${reason} ${next}`;

  if (item.kind !== expected.kind)
    return finish(`Bước này cần ${expected.kind === "pig" ? "dẫn Buta" : expected.kind === "branch" ? "nối nhánh" : expected.kind === "flag" ? "cắm cờ kết quả" : expected.kind === "copy" ? "chuyển giá trị thay thế" : `dùng ${expected.label.toLowerCase()}`}.`, "Hoàn tất thao tác hiện tại trước khi chuyển bước.");

  if (lesson === "tree-basics") {
    if (item.kind === "seed") {
      if (slot === undefined) return finish("Hạt phải nằm tại một nút để nối được với cây.", "Thả vào ô gốc hoặc ô con trống.");
      if (b.nodes[slot] !== undefined) return finish(`Vị trí này đã có ${b.nodes[slot]}; trồng đè sẽ làm mất nút đó.`, "So sánh từ gốc để tìm một ô con trống.");
      const problem = plantingReason(b, item.value!, slot);
      if (problem) return finish(problem, "So sánh từ gốc xuống: nhỏ đi trái, lớn đi phải.");
      return finish(slot === 0 ? `${item.value} có thể làm gốc của một cây khác. Cây mẫu này dùng gốc ${expected.value} làm mốc so sánh cho các nhánh.` : `Vị trí này không vi phạm thứ tự BST. Lượt dựng cây hiện tại đang trồng ${expected.value} trước khi nối cạnh của nó.`, slot === 0 ? `Đặt ${expected.value} làm mốc so sánh đầu tiên.` : "Hoàn tất cặp trồng nút–nối cạnh rồi tiếp tục hạt khác.");
    }
    if (item.kind === "branch") {
      const from = Number(item.id.split(":")[1]);
      const reason = slot === from ? "Nối nút với chính nó tạo vòng." : slot === 0 ? "Gốc không có cha; nối một nút con ngược về gốc tạo vòng." : slot === undefined || b.nodes[slot] === undefined ? "Đầu cạnh chưa có nút nên không thể tạo quan hệ cha–con." : parent(slot) !== from ? `${b.nodes[slot]} có cha trực tiếp là ${b.nodes[parent(slot)]}, không phải ${b.nodes[from]}; cạnh này nối sai quan hệ cha–con.` : "Cạnh cha–con này đã được nối; nối thêm sẽ lặp cạnh.";
      return finish(reason, "Mỗi nút ngoài gốc có đúng một cạnh nối từ cha trực tiếp.");
    }
    if (item.kind === "label" && slot !== undefined) {
      const value = b.nodes[slot], children = [slot * 2 + 1, slot * 2 + 2].filter(i => b.nodes[i] !== undefined).map(i => b.nodes[i]);
      if (item.label === "Gốc") return finish(`${value} có cha là ${b.nodes[parent(slot)]}, nên không phải gốc.`, "Gốc là nút duy nhất không có cha.");
      if (item.label === "Lá") return finish(`${value} còn con ${children.join(" và ")}, nên không phải lá.`, "Lá là nút không có con.");
      if (item.label === "Cha") return finish(`${value} không có nút con, nên không thể mang nhãn “Cha”.`, "Chọn nút có ít nhất một nút con trực tiếp.");
      const depth = Math.floor(Math.log2(slot + 1));
      const requested = Number(item.label.replace("Độ sâu ", ""));
      return finish(`Từ gốc tới ${value} có ${depth} cạnh, nên độ sâu là ${depth}, không phải ${requested}.`, "Đếm số cạnh, không đếm số nút trên đường đi.");
    }
  }

  if (item.kind === "card") {
    if (target !== "result") return finish("Duyệt cây chỉ ghi thứ tự, không chuyển vị trí các nút.", "Kéo nút vào khay thu hoạch.");
    const order = round.traversalOrder!, next = expected.slot!, chosen = item.slot!;
    const at = b.result.length + 1;
    if (order === "level") {
      const d = Math.floor(Math.log2(chosen + 1)), wantedDepth = Math.floor(Math.log2(next + 1));
      return finish(d > wantedDepth ? `Bạn chọn nút tầng ${d} khi tầng ${wantedDepth} chưa xong.` : "Trong cùng một tầng, bạn chọn nút phía phải trước nút phía trái chưa ghi.", "Duyệt hết tầng hiện tại từ trái sang phải rồi mới xuống tầng sau.");
    }
    const rules = { preorder: "Preorder ghi gốc trước, rồi cây con trái, cuối cùng cây con phải.", inorder: "Inorder duyệt cây con trái trước, ghi gốc, rồi cây con phải.", postorder: "Postorder duyệt hai cây con trái–phải xong mới ghi gốc." };
    let reason = `Đường duyệt đang tới ${expected.value} ở vị trí ${at}; ghi ${item.value} lúc này sẽ bỏ qua nút đó.`;
    let branch = chosen;
    while (branch > 0) {
      const ancestor = parent(branch); let pending = next;
      while (pending > ancestor) { if (parent(pending) === ancestor) break; pending = parent(pending); }
      if (branch % 2 === 0 && pending === ancestor * 2 + 1) {
        reason = `Bạn sang nhánh phải của ${b.nodes[ancestor]} khi cây con trái chưa duyệt xong.`;
        break;
      }
      branch = ancestor;
    }
    if (order === "preorder" && chosen > 0 && !b.visited.includes(parent(chosen))) reason = `Bạn ghi ${item.value} khi cha ${b.nodes[parent(chosen)]} chưa được ghi.`;
    if (order === "inorder" && b.nodes[chosen * 2 + 1] !== undefined && !b.visited.includes(chosen * 2 + 1)) reason = `${item.value} còn cây con trái chưa duyệt, nên chưa thể ghi gốc này.`;
    if (order === "postorder") {
      const remaining = [chosen * 2 + 1, chosen * 2 + 2].filter(i => b.nodes[i] !== undefined && !b.visited.includes(i));
      if (remaining.length) reason = `${item.value} còn con ${remaining.map(i => b.nodes[i]).join(" và ")} chưa ghi, nên chưa thể ghi nút cha.`;
    }
    return finish(reason, rules[order]);
  }

  if (lesson === "bst" && item.kind === "node" && slot !== undefined) {
    const proposed = cloneBoard(b); [proposed.nodes[item.slot!], proposed.nodes[slot]] = [proposed.nodes[slot], proposed.nodes[item.slot!]];
    const problem = Object.keys(proposed.nodes).map(Number).map(i => ancestryViolation(proposed.nodes, i)).find(Boolean);
    return finish(problem ? `Sau đổi chỗ, ${problem}.` : "Cặp nút này không khôi phục được thứ tự toàn cây.", "Mỗi nút phải nhỏ hơn mọi tổ tiên mà nó nằm bên trái và lớn hơn mọi tổ tiên mà nó nằm bên phải.");
  }

  if (lesson === "bst" && item.kind === "seed" && slot !== undefined) {
    if (b.nodes[slot] !== undefined) return finish(`Ô này đã có ${b.nodes[slot]}; thêm nút không thay thế nút cũ.`, "Chọn ô con trống theo các phép so sánh từ gốc.");
    const proposed = { ...b.nodes, [slot]: item.value! }, problem = ancestryViolation(proposed, slot);
    return finish(problem ? `${problem}.` : "Ô này chưa phải vị trí đến được từ đường so sánh của hạt.", "So sánh từ gốc, nhỏ đi trái và lớn đi phải.");
  }

  if (item.kind === "pig" || lesson === "bst-insert" && item.kind === "seed") {
    const current = b.cursor;
    if (current === null) return finish("Chưa bắt đầu từ nút gốc của thao tác.", lesson === "bst-delete" ? "Đặt Buta lên nút 40 cần xóa trước." : "Bắt đầu tại gốc rồi đi từng cạnh.");
    if (slot === undefined || parent(slot) !== current) return finish(`Đang ở ${b.nodes[current]}; thao tác này nhảy qua tầng hoặc ra khỏi nhánh con trực tiếp.`, "Mỗi lượt chỉ đi một cạnh từ nút hiện tại.");
    if (lesson === "bst-delete") {
      const predecessor = b.visited[1] === 1;
      return finish(predecessor ? `${b.nodes[current]} vẫn còn con phải; đi trái không tìm được số lớn nhất.` : `${b.nodes[current]} vẫn còn con trái; đi phải không tìm được số nhỏ nhất.`, predecessor ? "Đang tìm predecessor: đi phải đến khi không còn con phải." : "Đang tìm successor: đi trái đến khi không còn con trái.");
    }
    const value = item.kind === "seed" ? item.value! : Number(round.title.replace("Tìm ", ""));
    const pivot = b.nodes[current], correctSide = value < pivot ? "trái" : "phải";
    return finish(`${value} ${value < pivot ? "<" : ">"} ${pivot}, nhưng bạn đi ${side(slot)}.`, `Theo BST, cần đi ${correctSide} để ${lesson === "bst-search" ? "tìm giá trị này" : "thêm mà giữ đúng thứ tự"}.`);
  }

  if (item.kind === "flag") {
    const searched = Number(round.title.replace("Tìm ", ""));
    const here = slot === undefined ? undefined : b.nodes[slot];
    return finish(here !== undefined ? `${here} khác giá trị cần tìm ${searched}, nên không thể xác nhận tìm thấy tại đây.` : `Ô trống này không nằm ở cuối đường so sánh đã đi để tìm ${searched}; nó chưa chứng minh giá trị vắng mặt.`, b.nodes[b.cursor!] === undefined ? "Chỉ kết luận không tìm thấy khi đường so sánh từ gốc kết thúc ở ô trống." : `${searched} đã được tìm thấy tại điểm Buta đang đứng; xác nhận tại đó.`);
  }

  if (lesson === "bst-delete") {
    if (b.nodes[0] === undefined && step.target === "slot:0") {
      const method = b.visited[1] === 1 ? "predecessor" : "successor";
      return finish(item.id !== expected.id ? `${item.value} không phải ${method}: ${expected.value} mới là số ${method === "predecessor" ? "lớn nhất bên trái" : "nhỏ nhất bên phải"}. Dùng ${item.value} sẽ không giữ nguyên thứ tự của các nhánh còn lại.` : "Nút 40 đã được bỏ; đặt nút thay thế sang nhánh khác sẽ để cây thiếu gốc nối hai cây con.", `Kéo ${expected.value} lên ô gốc; ô cũ của nó sẽ tự trống.`);
    }
    if (item.kind === "copy") {
      if (slot !== expectedSlot) return finish(`Nút cần thay là ${b.nodes[expectedSlot!]}, bạn đang sửa ${placed}.`, "Giữ nguyên các nút khác và chuyển giá trị về nút cần xóa.");
      const method = b.visited[1] === 1 ? "predecessor" : "successor";
      return finish(`${item.value} không phải ${method} vừa tìm được.`, method === "predecessor" ? "Chọn giá trị lớn nhất bên trái, ở điểm Buta đã dừng." : "Chọn giá trị nhỏ nhất bên phải, ở điểm Buta đã dừng.");
    }
    if (step.target === "tray") {
      if (target !== "tray") return finish("Bước này tháo nút cũ, chưa chuyển hay nối nhánh.", "Đưa nút cần tháo về khay.");
      return finish(`Đang xóa ${expected.value}; tháo ${item.value} sẽ làm mất một giá trị cần giữ${b.nodes[item.slot! * 2 + 1] !== undefined || b.nodes[item.slot! * 2 + 2] !== undefined ? " và tách các nút con khỏi cha" : ""}.`, expected.slot === 0 ? "Kéo 40 ở gốc vào khay trước, rồi đưa nút thay thế lên ô trống." : "Giữ các giá trị khác để kết quả chỉ thiếu đúng giá trị được xóa.");
    }
    return finish(item.id !== expected.id ? `${item.value} không phải nút con còn lại của nút vừa tháo.` : "Bạn đang nối vào nhánh khác, không phải vị trí cha vừa trống.", "Đưa cây con còn lại vào đúng ô trống để không mất nhánh.");
  }
  return finish("Đối tượng này cần gắn với một vị trí trong cây để giữ quan hệ cha–con; thả vào đây không tạo được quan hệ đó.", "Chọn ô nút hoặc nhánh tương ứng với loại thẻ đang cầm.");
}
