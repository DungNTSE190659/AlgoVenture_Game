import { GRAPH, LINEAR_STRUCTURES, SEARCHING, STACK_QUEUE, TRACK, TREES, type Lesson } from "./learningTrack";

export type CurriculumBranch = { name: string; subtitle: string; lessons: Lesson[] };
export type CurriculumTopic = { id: string; name: string; subtitle: string; upper?: CurriculumBranch; lower?: CurriculumBranch };

/** A view of the existing curriculum. Lesson IDs and prerequisites stay unchanged. */
export const CURRICULUM_MAP: CurriculumTopic[] = [
  { id: "array", name: "Array", subtitle: "Mảng", upper: { name: "Sort", subtitle: "Sắp xếp", lessons: TRACK }, lower: { name: "Search", subtitle: "Tìm kiếm", lessons: SEARCHING } },
  { id: "linked", name: "Linked List", subtitle: "Danh sách liên kết", upper: { name: "Basics", subtitle: "Tạo · Duyệt · Tìm", lessons: LINEAR_STRUCTURES.slice(0, 3) }, lower: { name: "Operations", subtitle: "Chèn · Xóa · Đảo", lessons: LINEAR_STRUCTURES.slice(3) } },
  { id: "stack", name: "Stack", subtitle: "Ngăn xếp", upper: { name: "LIFO", subtitle: "Vào sau, ra trước", lessons: STACK_QUEUE.filter(lesson => lesson.id === "stack") } },
  { id: "queue", name: "Queue", subtitle: "Hàng đợi", lower: { name: "FIFO", subtitle: "Vào trước, ra trước", lessons: STACK_QUEUE.filter(lesson => lesson.id === "queue") } },
  { id: "tree", name: "Tree", subtitle: "Cây", upper: { name: "Basics", subtitle: "Cấu trúc · Duyệt cây", lessons: TREES.slice(0, 2) }, lower: { name: "BST", subtitle: "Cây tìm kiếm nhị phân", lessons: TREES.slice(2) } },
  { id: "graph", name: "Graph", subtitle: "Đồ thị", upper: { name: "Traversal", subtitle: "Nền tảng · DFS · BFS", lessons: GRAPH.slice(0, 3) }, lower: { name: "Shortest Path", subtitle: "Đường đi ngắn nhất", lessons: GRAPH.slice(3) } },
];

export const MAP_LESSON_LABELS: Record<string, string> = {
  "linked-list": "Construction", "linked-traversal": "Traversal", "linked-search": "Search",
  "linked-insertion": "Insertion", "linked-deletion": "Deletion", "linked-reversal": "Reversal",
  "tree-basics": "Tree Basics", "tree-traversal": "Tree Traversal", bst: "BST Basics",
  "bst-search": "BST Search", "bst-insert": "BST Insertion", "bst-delete": "BST Deletion",
  "graph-basics": "Graph Basics", stack: "Stack", queue: "Queue",
};
export const mapLessonName = (lesson: Lesson) => ({
  "tree-basics": "Tree Basics", "tree-traversal": "Tree Traversal", bst: "Binary Search Tree",
  "bst-search": "BST Search", "bst-insert": "BST Insertion", "bst-delete": "BST Deletion",
  "graph-basics": "Graph Basics",
} as Record<string, string>)[lesson.id] ?? lesson.name;
