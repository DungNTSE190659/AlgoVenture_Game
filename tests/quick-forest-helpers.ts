import { expect, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";
export async function enterForest(page: Page, mode = "Play") { await enterTrack(page,"Quick Sort",mode); await expect(page.locator(".quick-forest-world")).toBeVisible(); }
export async function forestInput(page: Page, values: number[]) { await page.getByRole("button",{name:"Tùy chọn",exact:true}).click(); await page.getByLabel("Các phần tử của mảng").fill(values.join(",")); await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click(); }
export async function sendFriend(page: Page, id: number, group: "pivot" | "small" | "equal" | "large" | "pool") {
  await page.locator(`[data-friend="${id}"]`).click();
  await page.getByRole("button",{ name: group === "pivot" ? "Chọn làm mốc" : group === "pool" ? /^Hàng chờ/ : `Đưa vào nhóm ${group === "small" ? "nhỏ hơn" : group === "equal" ? "bằng mốc" : "lớn hơn"}`, exact: group !== "pool" }).click();
}
export async function solveForest(page: Page) {
  for (let turn=0;turn<10;turn++) {
    if (await page.locator(".qf-victory").count()) return;
    if (!(await page.locator(".qf-junction").count())) await page.locator(".qf-map button:enabled").last().click();
    const group = await page.locator(".qf-pool [data-friend]").evaluateAll(nodes=>nodes.map(n=>({id:Number(n.getAttribute("data-friend")),value:Number(n.getAttribute("data-value"))})));
    const pivot = group[Math.floor(group.length / 2)]; await sendFriend(page,pivot.id,"pivot");
    while (await page.locator(".qf-pool [data-friend]").count()) {
      const friend = page.locator(".qf-pool [data-friend]").first(), id = Number(await friend.getAttribute("data-friend")), value=Number(await friend.getAttribute("data-value"));
      await sendFriend(page,id,value < pivot.value ? "small" : value === pivot.value ? "equal" : "large");
    }
    await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();
  }
  throw new Error("Quick Sort did not finish");
}
