import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, lesson = "Construction", demo = false) {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Mở nhánh Linked List", exact: true }).click();
  await page.getByRole("button", { name: `Linked List ${lesson}`, exact: true }).click();
  await page.getByRole("button", { name: demo ? "Xem demo" : "Thử thách", exact: true }).click();
}
async function discover(page: Page) {
  for (const answer of ["Dữ liệu 8", "Dữ liệu 3", "Dữ liệu 6", "NULL"]) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await expect(page.locator(".discovery-node-next")).toHaveText(["next", "next", "next"]);
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await expect(page.locator(".discovery-node-next")).toHaveText(["next", "next", "next"]);
    await page.getByRole("button", { name: answer === "NULL" ? "Tự xây danh sách" : "Tiếp tục", exact: false }).click();
  }
}

test("connectors are centered between nodes on desktop and phones", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await open(page);
    const offsets = await page.locator(".discovery-chain").evaluate(chain => {
      const nodes = [...chain.querySelectorAll(".discovery-piece, .discovery-null")].map(node => node.getBoundingClientRect());
      return [...chain.querySelectorAll(".discovery-arrow")].map((arrow, index) => {
        const box = arrow.getBoundingClientRect();
        return Math.abs((box.left + box.right) / 2 - (nodes[index].right + nodes[index + 1].left) / 2);
      });
    });
    for (const offset of offsets) expect(offset).toBeLessThan(1);
  }
});

test("beginner discovers links, learns from mistakes, then constructs two nodes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await expect(page.locator(".linked-bank")).toHaveCount(0);
  await page.getByRole("button", { name: "NULL", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("NULL là điểm kết thúc");
  await discover(page);
  await expect(page.locator(".linked-slot")).toHaveCount(2);
  await expect(page.locator(".linked-play-feedback")).not.toContainText("Chọn đinh");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Mỗi nút chứa một số");
  for (const [value, slot] of [[8, 0], [3, 1]]) {
    await page.getByRole("button", { name: `Khối ${value} ở khay`, exact: true }).click();
    await page.locator(`[data-linked-slot="${slot}"]`).click();
  }
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đặt cạnh nhau chưa tạo thành danh sách");
  await page.locator(".linked-nail").first().click();
  await page.getByRole("button", { name: "Lỗ của khối 8", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("trỏ vào chính nó");
  await page.getByRole("button", { name: "Lỗ của khối 3", exact: true }).click();
  await page.locator(".linked-nail").last().click();
  await page.getByRole("button", { name: "Lỗ NULL", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".victory-screen")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCSS("background-color", "rgb(239, 237, 255)");
  await expect(page.getByRole("dialog").locator(".bubble-fox")).toBeVisible();
  await expect(page.getByRole("dialog").locator(".linked-result-summary")).toContainText("Lỗi cần sửa3");
  await page.getByRole("button", { name: "Màn tiếp theo", exact: true }).click();
  await expect(page.locator(".linked-slot")).toHaveCount(3);
  await expect(page.locator(".linked-discovery")).toHaveCount(0);
});

test("phone challenge keeps NULL yellow and only exposes the necessary controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("button", { name: "NULL", exact: true }).hover();
  await expect(page.locator(".discovery-null")).toHaveCSS("background-color", "rgb(255, 219, 59)");
  await discover(page);
  await page.getByRole("button", { name: "NULL", exact: true }).hover();
  await expect(page.locator(".linked-null-target")).toHaveCSS("background-color", "rgb(255, 219, 59)");
  for (const name of ["Hoàn tác", "Làm lại", "Khám phá lại"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Cáo gợi ý", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Chạm khối");
  await expect(page.getByRole("button", { name: "Kiểm tra", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("Traversal starts assembled and completes; all six demos remain playable", async ({ page }) => {
  await open(page, "Traversal");
  await expect(page.locator(".journey-slot .linked-node")).toHaveCount(4);
  await page.getByRole("button", { name: "Cầm heo nhỏ", exact: true }).click();
  await page.getByRole("button", { name: "Lỗ của khối 1", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("bỏ sót");
  await page.getByRole("button", { name: "Lỗ của khối 5", exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Đi theo next", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".victory-screen")).toBeVisible();
  for (const name of ["Construction", "Traversal", "Search", "Insertion", "Deletion", "Reversal"]) {
    await open(page, name, true);
    const count = Number(await page.locator("progress").getAttribute("max"));
    for (let i = 0; i < count; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toBeVisible();
    await expect(page.locator(".linked-complete-check").first()).toBeVisible();
  }
});

test("prepared Search, Insertion and Deletion challenges can be completed", async ({ page }) => {
  for (const lesson of ["Search", "Insertion", "Deletion"]) {
    await open(page, lesson);
    await page.getByRole("button", { name: "Cầm heo nhỏ", exact: true }).click();
    await page.getByRole("button", { name: `Lỗ của khối ${lesson === "Search" ? 4 : 8}`, exact: true }).click();
    await page.getByRole("button", { name: "Đi theo next", exact: true }).click();
    if (lesson === "Search") await page.getByRole("button", { name: "Đã tìm thấy", exact: true }).click();
    if (lesson === "Insertion") {
      await page.getByRole("button", { name: "Chèn tại đây", exact: true }).click();
      await page.getByRole("button", { name: "Khối 5 ở khay", exact: true }).click();
      await page.getByRole("button", { name: "Chèn vào vị trí 2", exact: true }).click();
      await page.getByRole("button", { name: "Đinh của khối 5", exact: true }).click();
      await page.getByRole("button", { name: "Khối 6 ở hàng lắp", exact: true }).click();
      await page.getByRole("button", { name: "Đinh của khối 3", exact: true }).click();
      await page.getByRole("button", { name: "Lỗ của khối 5", exact: true }).click();
    }
    if (lesson === "Deletion") {
      await page.getByRole("button", { name: "Đinh của khối 3", exact: true }).click();
      await page.getByRole("button", { name: "Đinh của khối 8", exact: true }).click();
      await page.getByRole("button", { name: "Lỗ của khối 6", exact: true }).click();
      await page.getByRole("button", { name: "Khối 3 ở hàng lắp", exact: true }).click();
      await page.locator(".linked-bank").click({ position: { x: 10, y: 10 } });
    }
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await expect(page.locator(".victory-screen")).toBeVisible();
  }
});

test("discovery keeps one selection, reveals links after checks and highlights Continue", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: "Xem demo", exact: true })).toHaveCount(0);
  await expect(page.locator(".discovery-label").last()).toHaveText("TAIL");
  await expect(page.locator(".discovery-arrow.is-broken")).toHaveCount(3);
  await page.getByRole("button", { name: "NULL", exact: true }).click();
  await page.getByRole("button", { name: "Dữ liệu 3", exact: true }).hover();
  await expect(page.locator(".discovery-node.is-selected")).toHaveCount(0);
  await expect(page.locator(".discovery-null.is-selected")).toHaveCount(1);
  expect(await page.locator(".discovery-node").nth(1).evaluate(node => getComputedStyle(node, "::after").opacity)).toBe("0");
  await page.getByRole("button", { name: "Dữ liệu 8", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tiếp tục", exact: false })).toHaveCSS("background-color", "rgb(155, 232, 176)");
  await page.getByRole("button", { name: "Tiếp tục", exact: false }).click();
  await page.getByRole("button", { name: "Dữ liệu 3", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".discovery-arrow.is-broken")).toHaveCount(2);
});

test("five unsuccessful challenge checks show a Fox result and restart cleanly", async ({ page }) => {
  await open(page);
  await discover(page);
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("background-color", "rgb(239, 237, 255)");
  await expect(dialog.getByRole("heading")).toHaveText("Hết lượt thử rồi!");
  await expect(dialog.locator(".linked-result-summary")).toContainText("Lỗi cần sửa5");
  await expect(dialog.locator(".bubble-fox")).toBeVisible();
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".linked-bank .linked-node")).toHaveCount(2);
});

test("whole nodes select outgoing next and its target without separate hit regions", async ({ page }) => {
  await open(page);
  const first = page.getByRole("button", { name: "Dữ liệu 8", exact: true });
  const box = (await first.boundingBox())!;
  await first.click({ position: { x: box.width - 8, y: box.height / 2 } });
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đúng rồi");
  await page.getByRole("button", { name: "Tiếp tục", exact: false }).click();
  for (const answer of ["Dữ liệu 3", "Dữ liệu 6", "NULL"]) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    await page.getByRole("button", { name: answer === "NULL" ? "Tự xây danh sách" : "Tiếp tục", exact: false }).click();
  }
  for (const [value, slot] of [[8, 0], [3, 1]]) {
    await page.getByRole("button", { name: `Khối ${value} ở khay`, exact: true }).click();
    await page.locator(`[data-linked-slot="${slot}"]`).click();
  }
  await page.getByRole("button", { name: "Khối 8 ở hàng lắp", exact: true }).click();
  await page.getByRole("button", { name: "Khối 3 ở hàng lắp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đinh của khối 8 đang cắm vào khối 3", exact: true })).toBeVisible();
});
