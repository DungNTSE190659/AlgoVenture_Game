export const TREE_IDS = ["tree-basics", "tree-traversal", "bst", "bst-search", "bst-insert", "bst-delete"] as const;
export type TreeLessonId = typeof TREE_IDS[number];
export type TraversalOrder = "preorder" | "inorder" | "postorder" | "level";
export type BSTReplacement = "successor" | "predecessor";
export type TreeNodes = Record<number, number>;
export type TreeBoard = { nodes: TreeNodes; links: number[]; cursor: number | null; visited: number[]; result: number[]; labels: Record<number, string> };
export type TreeItem = { id: string; label: string; kind: "seed" | "node" | "card" | "pig" | "flag" | "label" | "branch" | "copy"; slot?: number; value?: number };
export type TreeTarget = { id: string; label: string; slot?: number };
export type TreeStep = { instruction: string; explanation: string; hint: string; items: TreeItem[]; targets: TreeTarget[]; item: string; target: string; after: TreeBoard; choices?: { target: string; strategy: BSTReplacement }[]; acceptedTargets?: string[] };
export type TreeRound = { title: string; summary: string; initial: TreeBoard; steps: TreeStep[]; validate: (board: TreeBoard) => boolean; traversalOrder?: TraversalOrder };
export type TreeCourse = { title: string; subtitle: string; rounds: TreeRound[] };
export const TREE_TITLES: Record<TreeLessonId, string> = { "tree-basics": "Cây cơ bản", "tree-traversal": "Duyệt cây", bst: "Cây tìm kiếm BST", "bst-search": "Tìm kiếm BST", "bst-insert": "Thêm nút BST", "bst-delete": "Xóa nút BST" };

export function board(nodes: TreeNodes = {}): TreeBoard {
  return { nodes: { ...nodes }, links: Object.keys(nodes).map(Number).filter(i => i > 0), cursor: null, visited: [], result: [], labels: {} };
}
export function cloneBoard(b: TreeBoard): TreeBoard { return { ...b, nodes: { ...b.nodes }, links: [...b.links], visited: [...b.visited], result: [...b.result], labels: { ...b.labels } }; }
export function traverse(nodes: TreeNodes, order: TraversalOrder): number[] {
  const output: number[] = [];
  function walk(i: number) {
    if (nodes[i] === undefined) return;
    if (order === "preorder") output.push(i);
    walk(i * 2 + 1);
    if (order === "inorder") output.push(i);
    walk(i * 2 + 2);
    if (order === "postorder") output.push(i);
  }
  if (order === "level") {
    const queue = nodes[0] === undefined ? [] : [0];
    while (queue.length) { const i = queue.shift()!; output.push(i); for (const child of [i * 2 + 1, i * 2 + 2]) if (nodes[child] !== undefined) queue.push(child); }
  } else walk(0);
  return output;
}
export function validBST(nodes: TreeNodes): boolean {
  let seen = 0;
  function walk(i: number, low: number, high: number): boolean {
    const value = nodes[i];
    if (value === undefined) return true;
    seen++;
    return value > low && value < high && walk(i * 2 + 1, low, value) && walk(i * 2 + 2, value, high);
  }
  return walk(0, -Infinity, Infinity) && seen === Object.keys(nodes).length;
}
export function searchPath(nodes: TreeNodes, value: number): number[] {
  const path: number[] = []; let i = 0;
  while (nodes[i] !== undefined) { path.push(i); if (nodes[i] === value) return path; i = value < nodes[i] ? i * 2 + 1 : i * 2 + 2; }
  path.push(i); return path;
}
export function insertBST(nodes: TreeNodes, value: number): TreeNodes {
  const path = searchPath(nodes, value), last = path.at(-1)!;
  return nodes[last] === value ? { ...nodes } : { ...nodes, [last]: value };
}
export function promoteSubtree(nodes: TreeNodes, from: number, to: number): TreeNodes {
  const result = { ...nodes }; const moves: [number, number, number][] = [];
  function collect(a: number, b: number) { if (nodes[a] === undefined) return; moves.push([a, b, nodes[a]]); collect(a * 2 + 1, b * 2 + 1); collect(a * 2 + 2, b * 2 + 2); }
  collect(from, to); for (const [a] of moves) delete result[a]; for (const [, b, value] of moves) result[b] = value;
  return result;
}
export function deleteBST(nodes: TreeNodes, value: number, strategy: BSTReplacement = "successor"): TreeNodes {
  let result = { ...nodes }; const i = searchPath(nodes, value).at(-1)!;
  if (nodes[i] === undefined) return result;
  const left = i * 2 + 1, right = i * 2 + 2;
  if (nodes[left] !== undefined && nodes[right] !== undefined) {
    const nextChild = strategy === "successor" ? 1 : 2;
    let replacement = strategy === "successor" ? right : left;
    while (nodes[replacement * 2 + nextChild] !== undefined) replacement = replacement * 2 + nextChild;
    result[i] = nodes[replacement]; delete result[replacement];
    return promoteSubtree(result, replacement * 2 + (strategy === "successor" ? 2 : 1), replacement);
  }
  delete result[i]; return promoteSubtree(result, nodes[left] !== undefined ? left : right, i);
}

const SMALL: TreeNodes = { 0: 40, 1: 20, 2: 60 };
const FULL: TreeNodes = { ...SMALL, 3: 10, 4: 30, 5: 50, 6: 70 };
const slotTarget = (slot: number, nodes: TreeNodes): TreeTarget => ({ id: `slot:${slot}`, slot, label: nodes[slot] === undefined ? slot === 0 ? "Ô gốc trống" : `Ô con ${slot % 2 ? "trái" : "phải"} của ${nodes[Math.floor((slot - 1) / 2)] ?? "nhánh"}` : `Nút ${nodes[slot]}` });
const nodeItems = (b: TreeBoard, kind: "node" | "card" | "copy" = "node"): TreeItem[] => Object.entries(b.nodes).map(([i, value]) => ({ id: `${kind}:${i}`, label: `${kind === "copy" ? "Giá trị" : "Nút"} ${value}`, kind, slot: Number(i), value }));
function builder(title: string, summary: string, initial: TreeBoard) {
  let current = cloneBoard(initial); const steps: TreeStep[] = [];
  return {
    get current() { return current; },
    get lastStep() { return steps[steps.length - 1]; },
    add(instruction: string, explanation: string, hint: string, items: TreeItem[], targets: TreeTarget[], item: string, target: string, change: (b: TreeBoard) => void) {
      const after = cloneBoard(current); change(after);
      steps.push({ instruction, explanation, hint, items, targets, item, target, after }); current = after;
    },
    finish(validate: (b: TreeBoard) => boolean = b => validBST(b.nodes)): TreeRound { return { title, summary, initial: cloneBoard(initial), steps, validate }; },
  };
}
function construction(nodes: TreeNodes, title: string): TreeRound {
  const b = builder(title, "Trồng từng nút rồi nối nhánh cha–con.", board());
  for (const i of Object.keys(nodes).map(Number)) {
    const value = nodes[i], parent = Math.floor((i - 1) / 2);
    const possible = Object.keys(nodes).map(Number).filter(k => b.current.nodes[k] === undefined && (k === 0 || b.current.nodes[Math.floor((k - 1) / 2)] !== undefined));
    b.add(`Trồng ${value} ${i === 0 ? "vào ô gốc" : `làm con ${i % 2 ? "trái" : "phải"} của ${nodes[parent]}`}.`, i === 0 ? "Gốc là điểm bắt đầu của cây, không có nút cha." : `${value} là nút con của ${nodes[parent]}; vị trí trái/phải tạo nên hình dạng cây.`, "Nhìn nhãn gốc hoặc trái/phải bên cạnh ô trống.", Object.entries(nodes).filter(([k]) => b.current.nodes[Number(k)] === undefined).map(([, v]) => ({ id: `seed:${v}`, label: `Hạt ${v}`, kind: "seed", value: v })), possible.map(k => slotTarget(k, b.current.nodes)), `seed:${value}`, `slot:${i}`, s => { s.nodes[i] = value; });
    if (i > 0) b.add(`Nối nhánh từ ${nodes[parent]} tới ${value}.`, "Một cạnh nối nút cha với nút con. Cây không có vòng.", `Kéo thẻ nhánh tới nút ${value} vừa trồng.`, [{ id: `branch:${parent}`, label: `Nhánh từ ${nodes[parent]}`, kind: "branch" }], Object.keys(b.current.nodes).map(Number).filter(k => k !== parent).map(k => slotTarget(k, b.current.nodes)), `branch:${parent}`, `slot:${i}`, s => { s.links.push(i); });
  }
  return b.finish(s => Object.keys(nodes).every(i => s.nodes[Number(i)] === nodes[Number(i)]) && s.links.length === Object.keys(nodes).length - 1);
}
function labelsRound(): TreeRound {
  const b = builder("Ai là gốc, ai là lá?", "Gắn nhãn để nhận biết vai trò của từng nút.", board(FULL));
  const allowed: Record<string, number[]> = { Gốc: [0], Lá: [3, 4, 5, 6], Cha: [0, 1, 2], "Độ sâu 2": [3, 4, 5, 6], "Độ sâu 0": [0], "Độ sâu 1": [1, 2] };
  for (const [name, i, explanation] of [["Gốc", 0, "40 không có cha: đây là gốc, độ sâu bằng 0."], ["Lá", 3, "10 không có nút con: đây là một nút lá."], ["Cha", 1, "20 là cha của cả 10 và 30."], ["Độ sâu 2", 4, "Từ gốc 40 qua 20 đến 30 có hai cạnh: độ sâu của 30 bằng 2."], ["Độ sâu 0", 0, "Gốc 40 không cần đi qua cạnh nào: độ sâu bằng 0."], ["Độ sâu 1", 1, "Từ gốc 40 đến 20 đi qua một cạnh: độ sâu của 20 bằng 1."]] as const) {
    const accepted = allowed[name];
    const destination = name === "Gốc" || name === "Độ sâu 0" ? "vào nút gốc" : name === "Lá" ? "vào một nút không có con" : name === "Cha" ? "vào một nút có con" : `vào một nút có độ sâu ${name.at(-1)}`;
    b.add(`Gắn nhãn “${name}” ${destination}.`, explanation, `Đếm cạnh từ gốc hoặc xem nút có con hay không. ${destination}.`, [{ id: `label:${name}`, label: name, kind: "label" }], Object.keys(FULL).map(Number).map(k => slotTarget(k, FULL)), `label:${name}`, `slot:${i}`, s => { s.labels[i] = [s.labels[i], name].filter(Boolean).join(" · "); });
    // The scripted target is used by Demo; Challenge accepts every equivalent node.
    const step = b.lastStep;
    step.acceptedTargets = accepted.map(slot => `slot:${slot}`);
  }
  return b.finish(s => Object.entries(allowed).every(([label, slots]) => Object.entries(s.labels).some(([slot, labels]) => slots.includes(Number(slot)) && labels.split(" · ").includes(label))));
}
function traversalRound(order: TraversalOrder, nodes: TreeNodes): TreeRound {
  const rule = { preorder: "Gốc → Trái → Phải", inorder: "Trái → Gốc → Phải", postorder: "Trái → Phải → Gốc", level: "Từng tầng, từ trái sang phải" }[order];
  const b = builder(`${order === "level" ? "Level order · BFS" : order[0].toUpperCase() + order.slice(1) + " · DFS"}`, rule, board(nodes));
  const sequence = traverse(nodes, order);
  for (const [index, i] of sequence.entries()) b.add(`Thu hoạch nút thứ ${index + 1} theo ${order === "level" ? "từng tầng" : order}.`, `Đã ghi ${nodes[i]} vào vị trí ${index + 1}. ${rule}.`, rule + ". Kéo nút từ cây vào khay thu hoạch; cây vẫn giữ nguyên.", nodeItems(b.current, "card").filter(item => !b.current.visited.includes(item.slot!)), [{ id: "result", label: `Giỏ thứ ${index + 1}` }], `card:${i}`, "result", s => { s.visited.push(i); s.result.push(nodes[i]); s.cursor = i; });
  return { ...b.finish(s => s.result.join() === sequence.map(i => nodes[i]).join()), traversalOrder: order };
}
function repairRound(nodes: TreeNodes, from: number, to: number, title: string): TreeRound {
  const b = builder(title, "Đổi chỗ hai hạt để mọi nhánh giữ đúng quy tắc BST.", board(nodes));
  b.add("Đổi chỗ hai nút đang làm sai quy tắc BST.", "Cây đã giữ đúng: mọi giá trị bên trái nhỏ hơn gốc, mọi giá trị bên phải lớn hơn gốc.", "Kiểm tra cả tổ tiên: nằm trong nhánh trái của 40 thì mọi giá trị phải nhỏ hơn 40.", nodeItems(b.current), Object.keys(nodes).map(Number).map(k => slotTarget(k, nodes)), `node:${from}`, `slot:${to}`, s => { [s.nodes[from], s.nodes[to]] = [s.nodes[to], s.nodes[from]]; });
  return b.finish();
}
function bstBuildRound(): TreeRound {
  const b = builder("Trồng một BST", "Nhỏ bên trái · Lớn bên phải · Không có số trùng.", board());
  for (const value of [40, 20, 60, 10, 30, 50, 70]) {
    const i = searchPath(b.current.nodes, value).at(-1)!;
    const possible = [0, ...Object.keys(b.current.nodes).map(Number).flatMap(k => [k * 2 + 1, k * 2 + 2])].filter(k => k <= 6 && b.current.nodes[k] === undefined);
    b.add(`Trồng hạt ${value} vào vị trí đúng trong BST.`, `${value} đã ở đúng nhánh. Quy tắc BST được giữ trên toàn bộ cây.`, "So sánh từ gốc: nhỏ đi trái, lớn đi phải; dừng ở ô trống.", [{ id: `seed:${value}`, kind: "seed", label: `Hạt ${value}`, value }], possible.map(k => slotTarget(k, b.current.nodes)), `seed:${value}`, `slot:${i}`, s => { s.nodes[i] = value; if (i > 0) s.links.push(i); });
  }
  return b.finish();
}
function searchRound(value: number): TreeRound {
  const b = builder(`Tìm ${value}`, "Dẫn Buta theo phép so sánh ở mỗi điểm dừng.", board(FULL));
  const path = searchPath(FULL, value);
  for (const [index, i] of path.entries()) {
    const previous = path[index - 1];
    b.add(index === 0 ? `Đặt Buta lên gốc để tìm ${value}.` : `${value} ${value < FULL[previous] ? "<" : ">"} ${FULL[previous]}: kéo Buta theo nhánh phù hợp.`, FULL[i] === undefined ? "Gặp nhánh rỗng: giá trị không có trong cây." : `${value === FULL[i] ? "Đã gặp đúng giá trị cần tìm" : `Đang xét ${FULL[i]}`}.`, "Mỗi lượt chỉ đi một cạnh: nhỏ sang trái, lớn sang phải.", [{ id: "pig", label: "Buta", kind: "pig", slot: b.current.cursor ?? undefined }], (index === 0 ? [0] : [previous * 2 + 1, previous * 2 + 2]).map(k => slotTarget(k, FULL)), "pig", `slot:${i}`, s => { s.cursor = i; s.visited.push(i); });
  }
  const last = path.at(-1)!;
  b.add(FULL[last] === value ? `Cắm cờ tại ${value} để xác nhận tìm thấy.` : "Cắm cờ tại ô rỗng để xác nhận không tìm thấy.", FULL[last] === value ? "Tìm kiếm thành công!" : "Tìm kiếm kết thúc ở nhánh rỗng, không phải ở một nút khác giá trị.", "Cắm cờ ở nơi Buta kết thúc tìm kiếm.", [{ id: "flag", label: "Cờ kết quả", kind: "flag" }], [slotTarget(last, FULL)], "flag", `slot:${last}`, s => { s.labels[last] = FULL[last] === value ? "Tìm thấy" : "Không có"; });
  return b.finish(s => s.cursor === last && !!s.labels[last]);
}
function insertionRound(nodes: TreeNodes, value: number): TreeRound {
  const b = builder(`Ươm hạt ${value}`, "Dẫn hạt qua từng nhánh rồi trồng vào ô trống.", board(nodes));
  const path = searchPath(nodes, value);
  for (const [index, i] of path.entries()) {
    const previous = path[index - 1], empty = nodes[i] === undefined;
    b.add(index === 0 ? `Kéo hạt ${value} tới ${empty ? "ô gốc trống" : "gốc"}.` : `${value} ${value < nodes[previous] ? "<" : ">"} ${nodes[previous]}: đưa hạt sang nhánh phù hợp.`, empty ? `Hạt ${value} đã trở thành nút mới. Các nút cũ giữ nguyên vị trí.` : `Tiếp tục so sánh ${value} với ${nodes[i]}.`, "Đặt hạt ở từng điểm dừng, không nhảy qua tầng. Chỉ trồng khi gặp ô trống.", [{ id: `seed:${value}`, label: `Hạt ${value}`, kind: "seed", value, slot: b.current.cursor ?? undefined }], (index === 0 ? [0] : [previous * 2 + 1, previous * 2 + 2]).map(k => slotTarget(k, nodes)), `seed:${value}`, `slot:${i}`, s => { s.cursor = i; s.visited.push(i); if (empty) { s.nodes[i] = value; if (i > 0) s.links.push(i); } });
  }
  return b.finish(s => validBST(s.nodes) && Object.values(s.nodes).includes(value));
}
function deletionRound(kind: "leaf" | "one" | "two", strategy: BSTReplacement = "successor"): TreeRound {
  const nodes = kind === "one" ? { ...SMALL, 3: 10 } : kind === "two" ? { ...FULL, 12: 55 } : FULL;
  const remove = kind === "leaf" ? 3 : kind === "one" ? 1 : 0, value = nodes[remove];
  const b = builder(kind === "leaf" ? "Xóa một nút lá" : kind === "one" ? "Xóa nút có một con" : "Xóa nút có hai con", kind === "two" ? "Chọn số nhỏ nhất bên phải hoặc lớn nhất bên trái để thay 40." : `Xóa ${value} và giữ nguyên quy tắc BST.`, board(nodes));
  const successor = strategy === "successor";
  const rule = successor ? "nhỏ nhất bên phải" : "lớn nhất bên trái";
  let replacement = remove;
  if (kind === "two") {
    const path = [remove, remove * 2 + (successor ? 2 : 1)];
    while (nodes[path.at(-1)! * 2 + (successor ? 1 : 2)] !== undefined) path.push(path.at(-1)! * 2 + (successor ? 1 : 2));
    replacement = path.at(-1)!;
    for (const i of path) {
      const previous = b.current.cursor;
      const instruction = previous === null ? "Đặt Buta lên nút 40 cần xóa."
        : previous === remove ? "Chọn trái tìm số lớn nhất, hoặc phải tìm số nhỏ nhất."
        : `Tìm ${strategy}: đi hết về ${successor ? "trái" : "phải"}.`;
      const explanation = previous === null ? "Nút 40 có hai con: có thể dùng số nhỏ nhất bên phải hoặc lớn nhất bên trái."
        : i === replacement ? `${nodes[i]} là ${strategy}: ${rule} của 40.`
        : `Bạn đã chọn ${strategy}: ${rule}, tiếp tục đi ${successor ? "trái" : "phải"}.`;
      const hint = previous === remove ? "Từ 40, đi trái để tìm predecessor (lớn nhất bên trái), hoặc đi phải tìm successor (nhỏ nhất bên phải)."
        : previous === null ? "Bắt đầu từ nút 40 cần xóa."
        : `Đang tìm ${strategy}: đi ${successor ? "trái" : "phải"} đến khi không còn con ${successor ? "trái" : "phải"}.`;
      b.add(instruction, explanation, hint, [{ id: "pig", kind: "pig", label: "Buta", slot: previous ?? undefined }], (previous === null ? [remove] : [previous * 2 + 1, previous * 2 + 2]).map(k => slotTarget(k, b.current.nodes)), "pig", `slot:${i}`, s => { s.cursor = i; s.visited.push(i); });
    }
    b.add("Kéo nút 40 vào khay để loại bỏ.", `Đã bỏ 40. Kéo ${nodes[replacement]} lên ô gốc trống; vị trí cũ của nó sẽ tự trống.`, `Đã tìm được ${nodes[replacement]} để thay thế. Chỉ loại bỏ nút 40.`, nodeItems(b.current), [{ id: "tray", label: "Khay tháo nút" }], `node:${remove}`, "tray", s => { delete s.nodes[remove]; s.cursor = null; });
    b.add(`Kéo nút ${nodes[replacement]} lên ô gốc trống.`, `Đã di chuyển ${nodes[replacement]} lên gốc; ô cũ tự trống.${nodes[replacement * 2 + (successor ? 2 : 1)] !== undefined ? " Tiếp theo nối nút con còn lại vào ô đó." : " Các nút còn lại được giữ nguyên."}`, `${nodes[replacement]} là ${strategy}: ${rule}. Di chuyển nút này lên ô gốc vừa trống.`, nodeItems(b.current), [slotTarget(remove, b.current.nodes)], `node:${replacement}`, `slot:${remove}`, s => { s.nodes[remove] = s.nodes[replacement]; delete s.nodes[replacement]; s.links = s.links.filter(i => i !== replacement); });
  }
  const detach = kind === "two" ? replacement : remove;
  if (kind !== "two") b.add(`Kéo nút ${value} về khay tháo nút.`, kind === "leaf" ? "Nút lá không có con, có thể tháo trực tiếp." : "Đã tháo nút cũ; giữ nguyên các nút còn lại.", `Chỉ tháo nút ${value} được yêu cầu.`, nodeItems(b.current), [{ id: "tray", label: "Khay tháo nút" }], `node:${detach}`, "tray", s => { delete s.nodes[detach]; s.links = s.links.filter(i => i !== detach); });
  const child = nodes[detach * 2 + 1] !== undefined ? detach * 2 + 1 : nodes[detach * 2 + 2] !== undefined ? detach * 2 + 2 : undefined;
  if (child !== undefined) {
    b.add(`Đưa nhánh ${b.current.nodes[child]} vào vị trí vừa trống.`, "Đã nối lại nhánh. Không có nút con nào bị mất.", "Kéo nút con còn lại vào ô của cha vừa tháo.", nodeItems(b.current), [slotTarget(detach, b.current.nodes)], `node:${child}`, `slot:${detach}`, s => { s.nodes = promoteSubtree(s.nodes, child, detach); s.links = Object.keys(s.nodes).map(Number).filter(i => i > 0); });
  }
  const expected = deleteBST(nodes, value, strategy);
  const round = b.finish(s => validBST(s.nodes) && JSON.stringify(Object.entries(s.nodes)) === JSON.stringify(Object.entries(expected)));
  if (kind === "two") round.steps[1].choices = [{ target: "slot:1", strategy: "predecessor" }, { target: "slot:2", strategy: "successor" }];
  return round;
}
export function createTreeCourse(id: TreeLessonId, strategy: BSTReplacement = "successor"): TreeCourse {
  const rounds = id === "tree-basics" ? [construction(SMALL, "Trồng cây đầu tiên"), labelsRound(), construction(FULL, "Một tán cây lớn hơn")]
    : id === "tree-traversal" ? [traversalRound("preorder", SMALL), traversalRound("inorder", FULL), traversalRound("postorder", FULL), traversalRound("level", FULL)]
    : id === "bst" ? [repairRound({ 0: 40, 1: 60, 2: 20 }, 1, 2, "Nhỏ trái · Lớn phải"), repairRound({ ...FULL, 4: 50, 5: 30 }, 4, 5, "Kiểm tra cả cây con"), bstBuildRound()]
    : id === "bst-search" ? [searchRound(30), searchRound(35), searchRound(50)]
    : id === "bst-insert" ? [insertionRound({}, 40), insertionRound(SMALL, 25), insertionRound(FULL, 55)]
    : [deletionRound("leaf"), deletionRound("one"), deletionRound("two", strategy)];
  return { title: TREE_TITLES[id], subtitle: id === "tree-traversal" ? "Bốn lối đi qua tán lá" : "Rừng Cây Tri Thức", rounds };
}
export function resolveTreeDrop(step: TreeStep, item: string, target: string): boolean {
  if (item === step.item && target === step.target) return true;
  if (item === step.item && step.choices?.some(choice => choice.target === target)) return true;
  if (item === step.item && step.acceptedTargets?.includes(target)) return true;
  // Swapping either of the two misplaced values repairs the same BST.
  return step.item.startsWith("node:") && step.target.startsWith("slot:") && item === step.target.replace("slot:", "node:") && target === step.item.replace("node:", "slot:");
}
export function treePositions(b: TreeBoard, step?: TreeStep): Record<number, { x: number; y: number }> {
  const slots = new Set([...Object.keys(b.nodes).map(Number), ...(step?.targets.flatMap(t => t.slot === undefined ? [] : [t.slot]) ?? [])]);
  if (b.cursor !== null) slots.add(b.cursor);
  for (const slot of [...slots]) { let i = slot; while (i > 0) { i = Math.floor((i - 1) / 2); slots.add(i); } }
  const positions: Record<number, { x: number; y: number }> = {};
  const depth = Math.max(1, ...[...slots].map(i => Math.floor(Math.log2(i + 1))));
  for (const i of slots) {
    const d = Math.floor(Math.log2(i + 1)), width = 2 ** d, rank = i + 1 - width;
    let x = 6 + 88 * (rank + .5) / width;
    if (d === 3) {
      const parent = Math.floor((i - 1) / 2), parentRank = parent + 1 - 2 ** (d - 1);
      x = 6 + 88 * (parentRank + .5) / 2 ** (d - 1) + (i % 2 ? -8 : 8);
    }
    positions[i] = { x, y: 18 + d * (64 / Math.max(2, depth)) };
  }
  return positions;
}
