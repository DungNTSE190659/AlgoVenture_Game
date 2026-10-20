import { describe, expect, it } from "vitest";
import { createGraphLesson } from "./graphLesson";

describe("Graph lesson frames", () => {
  it.each(["tutorial", "cycle", "complex"] as const)(
    "keeps graph collections usable in the %s demo",
    (difficulty) => {
      const frames = createGraphLesson(difficulty);
      const intro = frames[0].state;
      const found = frames.find((frame) => frame.kind === "FOUND");

      expect(intro.visited).toBeInstanceOf(Set);
      expect(intro.layer).toBeInstanceOf(Map);
      expect(intro.layer.get(intro.start)).toBe(0);
      expect(found).toBeDefined();
      expect(found?.state.visited).toBeInstanceOf(Set);
      expect(found?.state.layer).toBeInstanceOf(Map);
    },
  );
});
