import { describe, it, expect, beforeEach } from "vitest";
import { GameState, applyDelta, buildInitialDeck } from "../GameState";
import { ALL_AXES } from "../../data/events";

describe("GameState", () => {
  beforeEach(() => {
    ALL_AXES.forEach((a) => (GameState.profile[a] = 50));
  });

  it("applique un delta positif", () => {
    applyDelta("Justice", 10);
    expect(GameState.profile.Justice).toBe(60);
  });

  it("applique un delta négatif", () => {
    applyDelta("Charite", -15);
    expect(GameState.profile.Charite).toBe(35);
  });

  it("clamp à 0", () => {
    applyDelta("Foi", -200);
    expect(GameState.profile.Foi).toBe(0);
  });

  it("clamp à 100", () => {
    applyDelta("Force", 200);
    expect(GameState.profile.Force).toBe(100);
  });

  it("buildInitialDeck construit 5 cartes", () => {
    GameState.profile.Colere = 90;
    GameState.profile.Charite = 10;
    GameState.profile.Foi = 80;
    const deck = buildInitialDeck();
    expect(deck.length).toBe(5);
  });

  it("buildInitialDeck pioche dans les axes les plus distants de 50", () => {
    GameState.profile.Colere = 95;  // distance 45
    GameState.profile.Force = 90;   // distance 40
    GameState.profile.Charite = 5;  // distance 45
    const deck = buildInitialDeck();
    const axes = deck.map((c) => c.axis);
    expect(axes).toContain("Colere");
    expect(axes).toContain("Force");
  });
});
