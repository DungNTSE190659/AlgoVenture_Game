import { expect, test, type Page } from "@playwright/test";

async function openHub(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Lớp học của tôi", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCSS("transform", "none");
  await expect(page.locator('.class-empty .pig img').first()).toHaveJSProperty("complete", true);
}
async function joinArray(page: Page) {
  await page.getByRole("button", { name: "Khám phá lớp học", exact: true }).last().click();
  await page.getByLabel("Chủ đề lớp học").selectOption("Array");
  await page.getByLabel("Trình độ", { exact: true }).selectOption("Basic");
  await page.getByRole("button", { name: "Tham gia", exact: true }).last().click();
}

test("empty state, public filters, membership persistence and keyboard close", async ({ page }) => {
  await openHub(page);
  await expect(page.getByText("Bạn chưa vào lớp học nào, hãy tham gia một lớp học và phát triển hơn nào!")).toBeVisible();
  await page.screenshot({ path: ".qa/classroom-empty.png" });
  await page.getByRole("button", { name: "Khám phá lớp học", exact: true }).last().click();
  await expect(page.locator(".class-card")).toHaveCount(8);
  await expect(page.getByText("Biệt đội Array • SE490", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: ".qa/classroom-browse.png" });
  await page.getByLabel("Chủ đề lớp học").selectOption("Tree");
  await page.getByLabel("Trình độ", { exact: true }).selectOption("Advanced");
  await expect(page.locator(".class-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Chinh phục cây tìm kiếm" })).toBeVisible();
  await page.getByLabel("Tìm lớp học").fill("không có lớp này");
  await expect(page.getByText("Chưa tìm thấy lớp phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await page.getByLabel("Chủ đề lớp học").selectOption("Array");
  await page.getByLabel("Trình độ", { exact: true }).selectOption("Basic");
  await page.getByRole("button", { name: "Tham gia", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Bước chân đầu tiên với Array" })).toBeVisible();
  await page.screenshot({ path: ".qa/classroom-detail.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lớp học của tôi", exact: true })).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Lớp học của tôi", exact: true }).click();
  await expect(page.locator(".class-card")).toHaveCount(1);
});

test("private code validation and resource download", async ({ page }) => {
  await openHub(page);
  await page.getByLabel("Code lớp học", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Tham gia", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Code chưa đúng");
  await page.getByLabel("Code lớp học", { exact: true }).fill(" buta2026 ");
  await page.getByRole("button", { name: "Tham gia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biệt đội Array • SE490" })).toBeVisible();
  await page.getByRole("button", { name: "Tài liệu", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải sổ tay Array" }).click();
  expect((await download).suggestedFilename()).toBe("so-tay-Array.txt");
});

test("file submission and actual deadline enforcement", async ({ page }) => {
  await page.clock.install();
  await openHub(page);
  await joinArray(page);
  await page.getByRole("button", { name: "Bài tập", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nộp bài", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Đã hết hạn nộp bài" })).toBeDisabled();
  await page.getByLabel("Chọn file bài làm").setInputFiles({ name: "array.txt", mimeType: "text/plain", buffer: Buffer.from("const array = [1,2,3];") });
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(page.locator(".class-submitted")).toContainText("array.txt");
  await expect(page.getByRole("status")).toContainText("File chưa được gửi lên máy chủ");
  await page.clock.setSystemTime(Date.now() + 4 * 86400000);
  await page.clock.runFor(1000);
  await expect(page.getByLabel("Chọn file bài làm")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Nộp lại bài" })).toBeDisabled();
});

test("mobile quiz supports single, boolean and exact multiple selections", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHub(page);
  await page.screenshot({ path: ".qa/classroom-mobile.png" });
  await joinArray(page);
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu quiz" }).click();
  await expect(page.getByRole("button", { name: "Câu tiếp theo" })).toBeDisabled();
  await page.locator(".class-answers button").nth(0).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await page.locator(".class-answers button").nth(0).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await page.locator(".class-answers button").nth(0).click();
  await page.locator(".class-answers button").nth(1).click();
  await page.locator(".class-answers button").nth(3).click();
  await expect(page.locator('.class-answers button[aria-pressed="true"]')).toHaveCount(3);
  await page.screenshot({ path: ".qa/classroom-quiz-mobile.png" });
  expect(await page.locator(".class-dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Nộp quiz", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoàn thành! 3 / 3 câu đúng" })).toBeVisible();
  await page.getByRole("button", { name: "Làm lại quiz" }).click();
  await expect(page.getByRole("button", { name: "Câu tiếp theo" })).toBeDisabled();
});
