import type { Algorithm } from "./gameConfig";

export type TrackId = Algorithm | "selection" | "insertion" | "merge" | "array" | "stack" | "queue" | "linked-list" | "tree-basics" | "bst" | "bst-search" | "bst-insert" | "bst-delete" | "linear" | "binary" | "graph-basics" | "dfs" | "bfs" | "dijkstra";
export type RegionId = "arrays" | "linear-structures" | "trees" | "graph";
export type ArrayRouteId = "sort" | "search";
export type Progress = Partial<Record<TrackId, boolean>>;
export type Lesson = { id: TrackId; name: string; place: string; description: string; color: string; dark: string; group?: string };
export const TRACK: Lesson[] = [
  { id: "bubble", name: "Bubble Sort", place: "Suối Bong Bóng", description: "Đổi chỗ hai số cạnh nhau, đưa số lớn nhất về cuối.", color: "#89c4da", dark: "#4e91ae" },
  { id: "selection", name: "Selection Sort", place: "Vườn Tuyển Chọn", description: "Tìm số nhỏ nhất và đưa về đầu phần chưa sắp xếp.", color: "#e9bc6b", dark: "#a77c36" },
  { id: "insertion", name: "Insertion Sort", place: "Làng Xếp Hàng", description: "Chèn từng số vào đúng chỗ trong phần đã có thứ tự.", color: "#9abb80", dark: "#62884c" },
  { id: "merge", name: "Merge Sort", place: "Cầu Hợp Nhất", description: "Chia nhỏ rồi hợp nhất những dãy đã có thứ tự.", color: "#af9bda", dark: "#7f66b2" },
  { id: "quick", name: "Quick Sort", place: "Pháo Đài Chốt", description: "Chọn chốt, chia hai nhóm và chinh phục từng mảng con.", color: "#e9a18c", dark: "#b87160" },
];
export const LINEAR_STRUCTURES: Lesson[] = [
  { id: "linked-list", name: "Linked List", place: "Lối Đi Mắt Xích", description: "Nối từng nút dữ liệu để tạo nên một danh sách liên kết.", color: "#d7b57e", dark: "#a28756" },
  { id: "stack", name: "Stack", place: "Tháp Xếp Chồng", description: "Đặt lên trên cùng, lấy ra trước tiên: làm quen với ngăn xếp.", color: "#c0a1cf", dark: "#9272a3" },
  { id: "queue", name: "Queue", place: "Bến Đợi Đến Lượt", description: "Vào trước, ra trước: dẫn Buta qua hàng đợi.", color: "#8ebdc8", dark: "#5e8c9a" },
];
export const TREES: Lesson[] = [
  { id: "tree-basics", name: "Cây cơ bản", place: "Mầm Cây Đầu Tiên", description: "Làm quen với gốc, nút, cạnh và quan hệ cha con trong cây.", color: "#a8c88c", dark: "#708e55" },
  { id: "bst", name: "BST", place: "Cây Cửa Ngõ", description: "Khám phá cây tìm kiếm nhị phân: nhỏ bên trái, lớn bên phải.", color: "#9abc83", dark: "#63824e" },
  { id: "bst-search", name: "Tìm kiếm trên BST", place: "Theo Nhánh Tìm Số", description: "So sánh với nút hiện tại để chọn nhánh trái hoặc phải.", color: "#8ebbb1", dark: "#5d8d82" },
  { id: "bst-insert", name: "Thêm nút vào BST", place: "Ươm Một Nhánh Mới", description: "Tìm vị trí phù hợp để thêm nút, giữ tính chất cây tìm kiếm nhị phân.", color: "#c3bf86", dark: "#94915c" },
  { id: "bst-delete", name: "Xóa nút khỏi BST", place: "Chăm Sóc Tán Cây", description: "Xóa nút và nối lại cây để giữ tính chất cây tìm kiếm nhị phân.", color: "#c2a88e", dark: "#95795f" },
];
export const SEARCHING: Lesson[] = [
  { id: "linear", name: "Linear Search", place: "Đường Mòn Dấu Chân", description: "Xét lần lượt từng phần tử để tìm con số đang ẩn mình.", color: "#8dbbb7", dark: "#5c8d88" },
  { id: "binary", name: "Binary Search", place: "Đài Quan Sát", description: "Tìm trong mảng đã sắp xếp, mỗi lần thu hẹp một nửa.", color: "#91b9d1", dark: "#5e87a3" },
];
export const GRAPH: Lesson[] = [
  { id: "graph-basics", name: "Đồ thị cơ bản", place: "Bản Đồ Những Cây Cầu", description: "Làm quen với đỉnh, cạnh và cách biểu diễn các kết nối trong đồ thị.", color: "#a5b8c8", dark: "#778da2" },
  { id: "dfs", name: "DFS", place: "Hẻm Núi Chiều Sâu", description: "Đi sâu theo một nhánh trước khi quay lại khám phá nhánh khác.", color: "#b4a1ce", dark: "#8673a2" },
  { id: "bfs", name: "BFS", place: "Những Vòng Đồi", description: "Khám phá từng lớp các đỉnh gần Buta trước.", color: "#98b7ce", dark: "#6a8ba4" },
  { id: "dijkstra", name: "Dijkstra", place: "Đỉnh Đường Ngắn Nhất", description: "Tìm đường ngắn nhất trên đồ thị có trọng số không âm.", color: "#d9ac88", dark: "#b08261" },
];
export const ARRAY_ROUTES: { id: ArrayRouteId; name: string; description: string; lessons: Lesson[] }[] = [
  { id: "sort", name: "Sort", description: "Sắp xếp", lessons: TRACK.map(lesson => ({ ...lesson, group: "Sắp xếp trên mảng" })) },
  { id: "search", name: "Search", description: "Tìm kiếm", lessons: SEARCHING.map(lesson => ({ ...lesson, group: "Tìm kiếm trên mảng" })) },
];
// Both independent routes contribute to the parent subject's progress.
export const ARRAYS = ARRAY_ROUTES.flatMap(route => route.lessons);
export const REGIONS: { id: RegionId; name: string; topics: string; place: string; description: string; color: string; lessons: Lesson[] }[] = [
  { id: "arrays", name: "Mảng", topics: "Sort · Search", place: "Quần Đảo Những Ô Số", description: "Khám phá tìm kiếm và sắp xếp trên mảng.", color: "#9bb983", lessons: ARRAYS },
  { id: "linear-structures", name: "Danh sách", topics: "Linked List · Stack · Queue", place: "Bến Liên Kết", description: "Khám phá Linked List, ngăn xếp Stack và hàng đợi Queue.", color: "#dfb175", lessons: LINEAR_STRUCTURES },
  { id: "trees", name: "Cây", topics: "Cây cơ bản · BST", place: "Rừng Cây Tri Thức", description: "Từ kiến thức cây đến tìm kiếm, thêm và xóa trên BST.", color: "#8ebc9a", lessons: TREES },
  { id: "graph", name: "Đồ thị", topics: "Đỉnh · Cạnh · Thuật toán", place: "Cao Nguyên Kết Nối", description: "Hiểu đỉnh và cạnh, rồi khám phá DFS, BFS và Dijkstra.", color: "#b0a0cb", lessons: GRAPH },
];
export const ALL_LESSONS = REGIONS.flatMap(region => region.lessons);
export function arrayRouteForLesson(id: TrackId) { return ARRAY_ROUTES.find(route => route.lessons.some(lesson => lesson.id === id)); }
export function lessonAvailable(id: TrackId) { return id === "bubble" || id === "selection" || id === "insertion" || id === "quick" || id === "bfs"; }
export function regionForLesson(id: TrackId) { return REGIONS.find(region => region.lessons.some(lesson => lesson.id === id))!; }
export function regionComplete(id: RegionId, progress: Progress) { return REGIONS.find(region => region.id === id)!.lessons.every(lesson => progress[lesson.id]); }
export function regionUnlocked(id: RegionId, progress: Progress) {
  // TEMPORARY: Unlock graph region for testing BFS
  if (id === "graph") return true;
  const index = REGIONS.findIndex(region => region.id === id);
  return REGIONS.slice(0, index).every(region => regionComplete(region.id, progress));
}
export function lessonUnlocked(id: TrackId, progress: Progress) {
  if (!ALL_LESSONS.some(lesson => lesson.id === id)) return false;
  // TEMPORARY: BFS is always unlocked for testing
  if (id === "bfs") return true;
  return regionUnlocked(regionForLesson(id).id, progress) && lessonPrerequisites(id).every(lesson => progress[lesson.id]);
}
export function lessonPrerequisites(id: TrackId) {
  const route = arrayRouteForLesson(id);
  const lessons = route?.lessons ?? regionForLesson(id).lessons;
  const previous = lessons.slice(0, lessons.findIndex(lesson => lesson.id === id));
  // Unfinished Sort placeholders do not block the shipped games. Search has
  // its own sequence and never requires completion of a Sort lesson.
  // TEMPORARY: BFS has no prerequisites for testing
  if (id === "bfs") return [];
  if (route?.id === "sort") return previous.filter(lesson => lessonAvailable(lesson.id));
  return previous;
}
export function currentRouteLesson(routeId: ArrayRouteId, progress: Progress) {
  const lessons = ARRAY_ROUTES.find(route => route.id === routeId)!.lessons;
  return lessons.find(lesson => lessonAvailable(lesson.id) && !progress[lesson.id] && lessonUnlocked(lesson.id, progress))
    ?? lessons.find(lesson => !progress[lesson.id]) ?? lessons[lessons.length - 1];
}
export function currentLesson(progress: Progress) { return ALL_LESSONS.find(lesson => lessonAvailable(lesson.id) && !progress[lesson.id] && lessonUnlocked(lesson.id, progress)) ?? ALL_LESSONS.find(lesson => !progress[lesson.id]) ?? ALL_LESSONS[ALL_LESSONS.length - 1]; }
export function nextLesson(id: TrackId) {
  const region = regionForLesson(id);
  const lessons = arrayRouteForLesson(id)?.lessons ?? region.lessons;
  return lessons[lessons.findIndex(lesson => lesson.id === id) + 1] ?? REGIONS[REGIONS.indexOf(region) + 1]?.lessons[0];
}
export const STORAGE_KEY = "algoventure.world-progress.v3";
export function readTrackProgress(): Partial<Record<TrackId, boolean>> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("algoventure.world-progress.v2") ?? localStorage.getItem("algoventure.learning-track.v1") ?? "{}");
    if (!data || typeof data !== "object") return {};
    const progress: Partial<Record<TrackId, boolean>> = {};
    // Completion IDs stay the same when the old combined route is split.
    for (const item of ALL_LESSONS)
      if ((data as Record<string, unknown>)[item.id] === true) progress[item.id] = true;
    return progress;
  } catch { return {}; }
}
export function saveTrackProgress(progress: Partial<Record<TrackId, boolean>>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Keep playing when storage is unavailable. */ }
}
