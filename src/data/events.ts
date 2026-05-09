// Événements de Phase Vie courts pour le proto Cercle Luxure
// 3 événements seulement pour aller vite jusqu'au combat polish.

export type Axis =
  | "Orgueil" | "Avarice" | "Luxure" | "Envie" | "Gourmandise" | "Colere" | "Paresse"
  | "Foi" | "Esperance" | "Charite" | "Prudence" | "Justice" | "Force" | "Temperance";

export const ALL_AXES: Axis[] = [
  "Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse",
  "Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance",
];

export const SINS: Axis[] = ["Orgueil", "Avarice", "Luxure", "Envie", "Gourmandise", "Colere", "Paresse"];
export const VIRTUES: Axis[] = ["Foi", "Esperance", "Charite", "Prudence", "Justice", "Force", "Temperance"];

export interface OptionEvent {
  text: string;
  deltas: Partial<Record<Axis, number>>;
}

export interface LifeEvent {
  code: string;
  phase: string;
  trame: string;
  options: OptionEvent[];
}

export const LIFE_EVENTS: LifeEvent[] = [
  {
    code: "ENF-01",
    phase: "Enfance",
    trame: "Tu as 7 ans. Tu casses un objet précieux de ta mère. Personne n'a vu. Elle entre dans la pièce.",
    options: [
      { text: "Avouer immédiatement.",                       deltas: { Foi: +10, Justice: +8 } },
      { text: "Mentir et accuser un frère.",                 deltas: { Colere: +8, Foi: -8 } },
      { text: "Pleurer sans rien dire.",                     deltas: { Paresse: +6, Temperance: +4 } },
      { text: "Cacher l'objet et faire comme si rien.",      deltas: { Luxure: +6, Foi: -6 } },
    ],
  },
  {
    code: "ADO-03",
    phase: "Adolescence",
    trame: "Quelqu'un te déclare son amour. Tu ressens une attirance, mais tu sais que cette personne traverse une période fragile.",
    options: [
      { text: "Dire oui sans se poser de question.",          deltas: { Luxure: +12, Prudence: -6 } },
      { text: "Refuser pour la protéger.",                    deltas: { Charite: +10, Temperance: +6 } },
      { text: "Accepter \"à voir\" sans s'engager.",          deltas: { Luxure: +8, Paresse: +4 } },
      { text: "Différer la réponse en honnêteté.",            deltas: { Prudence: +8, Foi: +6 } },
    ],
  },
  {
    code: "ADU-07",
    phase: "Âge adulte",
    trame: "Tu rencontres quelqu'un qui te ressemble profondément. Tu es marié(e) avec enfants.",
    options: [
      { text: "Couper net.",                                   deltas: { Temperance: +12, Foi: +8 } },
      { text: "Maintenir une amitié distante.",                deltas: { Temperance: +6, Prudence: +6 } },
      { text: "Avoir une aventure brève.",                     deltas: { Luxure: +14, Foi: -8 } },
      { text: "Tout quitter pour cette personne.",             deltas: { Luxure: +16, Charite: -10 } },
    ],
  },
];
