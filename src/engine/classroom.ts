export type Topic = "Array" | "LinkedList" | "Tree" | "Graph";
export type Classroom = { id: string; title: string; topic: Topic; level: "Basic" | "Advanced"; instructor: string; members: number; description: string; code?: string };
export const classrooms: Classroom[] = [
  { id: "array-basic", title: "Bước chân đầu tiên với Array", topic: "Array", level: "Basic", instructor: "Cô Minh Anh", members: 24, description: "Cùng Buta khám phá mảng, tìm kiếm và những thuật toán sắp xếp đầu tiên." },
  { id: "linked-basic", title: "Kết nối những mắt xích", topic: "LinkedList", level: "Basic", instructor: "Thầy Hoàng Nam", members: 18, description: "Hiểu node, con trỏ và tự tay xây dựng danh sách liên kết." },
  { id: "tree-basic", title: "Ươm mầm cây kiến thức", topic: "Tree", level: "Basic", instructor: "Cô Thu Hà", members: 32, description: "Từ gốc đến lá: làm quen cây nhị phân và các cách duyệt cây." },
  { id: "graph-advanced", title: "Nhà thám hiểm đồ thị", topic: "Graph", level: "Advanced", instructor: "Thầy Đức Anh", members: 16, description: "Chinh phục BFS, DFS và khám phá đường đi trên đồ thị." },
  { id: "array-advanced", title: "Bậc thầy sắp xếp", topic: "Array", level: "Advanced", instructor: "Cô Minh Anh", members: 20, description: "Thử sức với Merge Sort, Quick Sort và độ phức tạp thuật toán." },
  { id: "linked-advanced", title: "Thử thách LinkedList", topic: "LinkedList", level: "Advanced", instructor: "Thầy Hoàng Nam", members: 12, description: "Đảo ngược danh sách và giải quyết những bài toán nhiều con trỏ." },
  { id: "tree-advanced", title: "Chinh phục cây tìm kiếm", topic: "Tree", level: "Advanced", instructor: "Cô Thu Hà", members: 21, description: "Luyện tập tìm kiếm, chèn và xóa trên cây tìm kiếm nhị phân." },
  { id: "graph-basic", title: "Những tuyến đường đầu tiên", topic: "Graph", level: "Basic", instructor: "Thầy Đức Anh", members: 28, description: "Khám phá đỉnh, cạnh và cách biểu diễn một đồ thị." },
  { id: "private-array", title: "Biệt đội Array • SE490", topic: "Array", level: "Basic", instructor: "Cô Minh Anh", members: 15, description: "Không gian học tập riêng của biệt đội SE490.", code: "BUTA2026" },
];
export const topics: Topic[] = ["Array", "LinkedList", "Tree", "Graph"];
export const topicColors: Record<Topic, string> = { Array: "#a0b981", LinkedList: "#d6aa75", Tree: "#86b5a0", Graph: "#ad9bc8" };
export type Question = { type: "single" | "boolean" | "multiple"; title: string; options: string[]; correct: number[]; explanation: string };
export function questionsFor(topic: Topic): Question[] {
  const content: Record<Topic, [string, string[], number, string, boolean, string[], number[]]> = {
    Array: ["Chỉ số đầu tiên của mảng trong JavaScript là bao nhiêu?", ["0", "1", "−1", "Phụ thuộc độ dài mảng"], 0, "Mảng JavaScript có thể truy cập phần tử theo chỉ số.", true, ["Truy cập theo chỉ số", "Lưu nhiều phần tử", "Luôn được sắp xếp sẵn", "Có thuộc tính length"], [0, 1, 3]],
    LinkedList: ["Một node trong singly linked list thường chứa gì?", ["Chỉ một chỉ số", "Dữ liệu và liên kết next", "Hai mảng", "Chỉ liên kết prev"], 1, "Node cuối của singly linked list luôn trỏ về node đầu.", false, ["Có thể chèn node", "Có thể xóa node", "Truy cập chỉ số luôn O(1)", "Các node có liên kết với nhau"], [0, 1, 3]],
    Tree: ["Node không có node con được gọi là gì?", ["Gốc", "Cạnh", "Lá", "Đường đi"], 2, "Mỗi node trong cây nhị phân có tối đa hai node con.", true, ["Preorder", "Inorder", "Postorder", "Bubble Sort"], [0, 1, 2]],
    Graph: ["BFS thường sử dụng cấu trúc dữ liệu nào?", ["Stack", "Queue", "Cây tìm kiếm", "Heap"], 1, "Đồ thị có hướng có thể có chu trình.", true, ["Danh sách kề", "Ma trận kề", "Danh sách cạnh", "Chỉ một biến boolean"], [0, 1, 2]],
  };
  const [title, options, answer, statement, truth, multi, correct] = content[topic];
  return [
    { type: "single", title, options, correct: [answer], explanation: `Đáp án đúng: ${options[answer]}.` },
    { type: "boolean", title: statement, options: ["Đúng", "Sai"], correct: [truth ? 0 : 1], explanation: truth ? "Nhận định này đúng." : "Node cuối thường có next = null; chỉ danh sách vòng mới nối lại node đầu." },
    { type: "multiple", title: topic === "Tree" ? "Chọn các cách duyệt cây." : topic === "Graph" ? "Chọn các cách biểu diễn đồ thị." : `Chọn tất cả nhận định đúng về ${topic}.`, options: multi, correct, explanation: `Các đáp án đúng: ${correct.map(i => multi[i]).join(", ")}.` },
  ];
}
export function isCorrect(selected: number[], correct: number[]) { return selected.length === correct.length && correct.every(value => selected.includes(value)); }
export function readMemberships(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem("buta-classrooms-v1") ?? "[]"); return Array.isArray(value) ? classrooms.filter(c => value.includes(c.id)).map(c => c.id) : []; } catch { return []; }
}
