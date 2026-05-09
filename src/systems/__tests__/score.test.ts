import { describe, it, expect } from "vitest";
import { computeScore } from "../SaveSystem";

describe("computeScore", () => {
  it("victoire rapide sans sacrifice donne un bon score", () => {
    const s = computeScore({
      victory: true,
      turnsUsed: 3,
      cardsSacrificed: 0,
      axesRemaining: 500,
      difficulty: "normal",
    });
    expect(s).toBeGreaterThan(1500);
  });

  it("défaite donne un score nettement plus faible qu'une victoire équivalente", () => {
    const lossScore = computeScore({
      victory: false,
      turnsUsed: 5,
      cardsSacrificed: 2,
      axesRemaining: 200,
      difficulty: "normal",
    });
    const winScore = computeScore({
      victory: true,
      turnsUsed: 5,
      cardsSacrificed: 2,
      axesRemaining: 200,
      difficulty: "normal",
    });
    expect(winScore - lossScore).toBe(1000);
  });

  it("difficulté pénible donne un bonus de 50%", () => {
    const baseline = computeScore({
      victory: true, turnsUsed: 5, cardsSacrificed: 1,
      axesRemaining: 400, difficulty: "normal",
    });
    const penible = computeScore({
      victory: true, turnsUsed: 5, cardsSacrificed: 1,
      axesRemaining: 400, difficulty: "penible",
    });
    expect(penible).toBeGreaterThan(baseline * 1.4);
  });

  it("mode doux pénalise le score (×0.7)", () => {
    const baseline = computeScore({
      victory: true, turnsUsed: 5, cardsSacrificed: 1,
      axesRemaining: 400, difficulty: "normal",
    });
    const doux = computeScore({
      victory: true, turnsUsed: 5, cardsSacrificed: 1,
      axesRemaining: 400, difficulty: "doux",
    });
    expect(doux).toBeLessThan(baseline);
  });
});
