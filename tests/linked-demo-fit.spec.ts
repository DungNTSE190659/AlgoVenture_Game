import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`six mobile demos fit without scrolling at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const lesson of ["Construction", "Traversal", "Search", "Insertion", "Deletion", "Reversal"]) {
      await page.goto("/");
      await page.getByRole("button", { name: "Mở nhánh Linked List", exact: true }).click();
      await page.getByRole("button", { name: `Linked List ${lesson}`, exact: true }).click();
      await page.getByRole("button", { name: "Xem demo", exact: true }).click();
      const steps = Number(await page.locator("progress").getAttribute("max"));
      for (let step = 0; step <= steps; step++) {
        const problems = await page.evaluate(() => {
          const problems: string[] = [];
          const root = document.querySelector<HTMLElement>(".linked-demo")!;
          if (Array.from(root.querySelectorAll(".linked-node-next")).some(label => label.textContent !== "next")) problems.push("next label changed");
          if (root.scrollWidth > root.clientWidth + 1 || root.scrollHeight > root.clientHeight + 1) problems.push("demo overflows");
          if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) problems.push("page scrolls");
          for (const selector of [".linked-bank .linked-node", ".linked-slot", ".linked-node-next", ".linked-empty-slot", ".journey-empty", ".linked-null-target", ".linked-demo-dialogue .linked-speech", ".linked-demo-controls", ".linked-demo-playback button"]) {
            for (const element of root.querySelectorAll<HTMLElement>(selector)) {
              const box = element.getBoundingClientRect();
              if (!box.width || !box.height) continue;
              if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1) problems.push(`${selector}: ${JSON.stringify(box.toJSON())}`);
              if (selector.includes("speech") && element.scrollHeight > element.clientHeight + 1) problems.push("narration clipped");
              if ([".linked-node-next", ".linked-empty-slot", ".journey-empty"].includes(selector) && element.scrollWidth > element.clientWidth + 1) problems.push(`${selector}: text overflows`);
            }
          }
          if (innerHeight > innerWidth) {
            const stage = root.querySelector(".linked-playfield")!.getBoundingClientRect();
            const assembly = root.querySelector(".linked-assembly")!.getBoundingClientRect();
            const middle = (assembly.top + assembly.bottom) / 2;
            if (middle > innerHeight * .65 || middle < innerHeight * .2) problems.push("assembly is outside the middle play area");
            const guide = root.querySelector(".linked-demo-dialogue")!.getBoundingClientRect();
            if (stage.bottom > guide.top + 1) problems.push("playfield overlaps dialogue");
            const nodes = Array.from(root.querySelectorAll(".linked-bank .linked-node"));
            const firstSlot = root.querySelector(".linked-slot");
            if (nodes.length && firstSlot) {
              const bankBottom = Math.max(...nodes.map(node => node.getBoundingClientRect().bottom));
              if (firstSlot.getBoundingClientRect().top - bankBottom > 90) problems.push("bank too far from assembly");
            }
          }
          return problems;
        });
        expect(problems, `${lesson}, frame ${step}`).toEqual([]);
        if (step < steps) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
      }
      await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toBeVisible();
    }
  });
}
