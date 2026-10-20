import { describe, it, expect } from "vitest";
import {
  createTutorialGraph,
  createCycleGraph,
  createComplexGraph,
  createBFSTimeline,
  validateBFSAction,
  createGraph,
  type GraphDifficulty,
} from "./graph";

describe("Graph Engine", () => {
  describe("createTutorialGraph", () => {
    it("should create a graph with 5 vertices", () => {
      const graph = createTutorialGraph();
      expect(graph.vertices).toHaveLength(5);
      expect(graph.edges).toHaveLength(4);
      expect(graph.start).toBe(0);
      expect(graph.goal).toBe(4);
    });

    it("should have correct vertex labels", () => {
      const graph = createTutorialGraph();
      expect(graph.vertices[0].label).toBe("A");
      expect(graph.vertices[1].label).toBe("B");
      expect(graph.vertices[2].label).toBe("C");
      expect(graph.vertices[3].label).toBe("D");
      expect(graph.vertices[4].label).toBe("E");
    });

    it("should initialize queue with start vertex", () => {
      const graph = createTutorialGraph();
      expect(graph.queue).toEqual([0]);
      expect(graph.visited.has(0)).toBe(true);
    });
  });

  describe("createCycleGraph", () => {
    it("should create a graph with 6 vertices and a cycle", () => {
      const graph = createCycleGraph();
      expect(graph.vertices).toHaveLength(6);
      expect(graph.edges).toHaveLength(6);
      expect(graph.start).toBe(0);
      expect(graph.goal).toBe(5);
    });

    it("should have cycle A-B-C-A", () => {
      const graph = createCycleGraph();
      const edges = graph.edges;
      expect(edges.some(e => e.from === 0 && e.to === 2)).toBe(true);
      expect(edges.some(e => e.from === 1 && e.to === 2)).toBe(true);
      expect(edges.some(e => e.from === 0 && e.to === 1)).toBe(true);
    });
  });

  describe("createComplexGraph", () => {
    it("should create a graph with 8 vertices", () => {
      const graph = createComplexGraph();
      expect(graph.vertices).toHaveLength(8);
      expect(graph.edges).toHaveLength(8);
      expect(graph.start).toBe(0);
      expect(graph.goal).toBe(7);
    });
  });

  describe("createBFSTimeline", () => {
    it("should generate timeline for tutorial graph", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].action).toBe("START");
      expect(timeline[timeline.length - 1].action).toBe("DONE");
    });

    it("should find goal in tutorial graph", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      
      const foundStep = timeline.find(step => step.action === "FOUND");
      expect(foundStep).toBeDefined();
      expect(foundStep?.message).toContain("E");
    });

    it("should have correct dequeue order", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      
      const dequeueSteps = timeline.filter(step => step.action === "DEQUEUE");
      expect(dequeueSteps[0].expectedVertex).toBe(0); // A
      expect(dequeueSteps[1].expectedVertex).toBe(1); // B
      expect(dequeueSteps[2].expectedVertex).toBe(2); // C
    });

    it("should enqueue correct neighbors", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      
      const enqueueSteps = timeline.filter(step => step.action === "ENQUEUE");
      expect(enqueueSteps).toHaveLength(4); // B, C, D, E
    });

    it("should handle cycle graph correctly", () => {
      const graph = createCycleGraph();
      const timeline = createBFSTimeline(graph);
      
      const foundStep = timeline.find(step => step.action === "FOUND");
      expect(foundStep).toBeDefined();
      expect(foundStep?.message).toContain("F");
    });

    it("should not enqueue visited vertices", () => {
      const graph = createCycleGraph();
      const timeline = createBFSTimeline(graph);
      
      // C should not be enqueued twice (A-C edge creates cycle)
      const enqueueSteps = timeline.filter(step => step.action === "ENQUEUE");
      const cEnqueues = enqueueSteps.filter(step => step.message.includes("C"));
      expect(cEnqueues.length).toBe(1);
    });
  });

  describe("validateBFSAction", () => {
    it("should validate correct dequeue", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      const dequeueStep = timeline.find(step => step.action === "DEQUEUE")!;
      
      const result = validateBFSAction(dequeueStep, "DEQUEUE", 0);
      expect(result.valid).toBe(true);
    });

    it("should reject wrong dequeue vertex", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      const dequeueStep = timeline.find(step => step.action === "DEQUEUE")!;
      
      const result = validateBFSAction(dequeueStep, "DEQUEUE", 1);
      expect(result.valid).toBe(false);
    });

    it("should reject wrong action type", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      const dequeueStep = timeline.find(step => step.action === "DEQUEUE")!;
      
      const result = validateBFSAction(dequeueStep, "ENQUEUE", 0);
      expect(result.valid).toBe(false);
    });

    it("should validate correct enqueue", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      const enqueueStep = timeline.find(step => step.action === "ENQUEUE")!;
      
      const result = validateBFSAction(enqueueStep, "ENQUEUE", enqueueStep.expectedVertex ?? null);
      expect(result.valid).toBe(true);
    });

    it("should reject enqueue of non-neighbor", () => {
      const graph = createTutorialGraph();
      const timeline = createBFSTimeline(graph);
      const enqueueStep = timeline.find(step => step.action === "ENQUEUE")!;
      
      const result = validateBFSAction(enqueueStep, "ENQUEUE", 99);
      expect(result.valid).toBe(false);
    });
  });

  describe("createGraph", () => {
    it("should create tutorial graph", () => {
      const graph = createGraph("tutorial");
      expect(graph.vertices).toHaveLength(5);
    });

    it("should create cycle graph", () => {
      const graph = createGraph("cycle");
      expect(graph.vertices).toHaveLength(6);
    });

    it("should create complex graph", () => {
      const graph = createGraph("complex");
      expect(graph.vertices).toHaveLength(8);
    });
  });
});
