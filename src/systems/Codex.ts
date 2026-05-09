// C.1 — Codex narratif : pages débloquées par victoires
import { GameState, addCodexPage, type Ending } from "./GameState";

const CODEX_KEY = "mortdansl-codex-content";

export interface CodexPage {
  id: number;
  title: string;
  body: string;
  ending: Ending | null;
  unlockedAt: string;  // ISO date
}

// 100 fragments narratifs — court, évocateur (LocalThunk-style)
export const CODEX_FRAGMENTS: Array<{ title: string; body: string }> = [
  // Phase enfance fragments
  { title: "L'objet brisé", body: "Tu te souviens du cristal en mille morceaux. Tu as menti. Le mensonge a été le premier péché." },
  { title: "La cour", body: "On t'a désigné. Tu as obéi. Tu n'as plus jamais regardé le visage exclu." },
  { title: "La maladie", body: "On t'a tenu loin. Tu as compris : la mort est ce dont les adultes parlent en chuchotant." },
  { title: "Le cadeau", body: "Tu as souri. Tu as menti pour ne pas blesser. C'était la première charité." },
  { title: "Le porte-monnaie", body: "Tu l'as gardé. Et plus tard, tu n'as jamais rien donné facilement." },
  { title: "Le téléphone", body: "Tu as menti pour ta mère. Et tu as appris : on peut mentir et être bon." },
  { title: "Le secret", body: "Ton ami t'a confié. Tu as parlé. Il ne t'a plus jamais regardé." },
  { title: "Premier baiser", body: "Tu as eu peur. Tu as dit oui. La peur ne t'a plus quitté." },
  { title: "L'animal", body: "Tu l'as soigné. Il est mort. Tu as détesté Dieu pour la première fois." },
  { title: "Le bulletin", body: "On t'a applaudi. Tu as commencé à mépriser ceux qui n'ont pas. C'était l'orgueil." },
  // Adolescence
  { title: "La cigarette", body: "Tu as tiré. Tu as toussé. Tu as ri. Tu n'as plus rien refusé." },
  { title: "Le harcelé", body: "Tu as filmé. Les vues t'ont nourri longtemps." },
  { title: "L'examen", body: "Tu as triché. Tu as oublié. Le souvenir revient juste avant le sommeil." },
  { title: "La dispute", body: "Tu as crié sur ton père. Il a baissé les yeux. Tu n'as plus jamais été son fils." },
  { title: "L'aventure brève", body: "Tu as embrassé l'ami(e) de ton ami. Tu as nié. Tu as oublié. Tu te souviens." },
  { title: "La bourse", body: "Tu l'as gardée. Lui n'a rien dit. Lui n'a plus jamais rien fait." },
  { title: "La drogue", body: "Tu as accepté. Tu as plané. Tu as redescendu. Tu te demandais ce qui restait." },
  { title: "Le père au chômage", body: "Tu l'as évité. Il s'est replié. Tu as pris la place que tu attendais." },
  { title: "Le prof", body: "Tu as encaissé. Tu as souri. Tu as appris à hair longtemps." },
  { title: "La rupture", body: "Tu as quitté. Tu as pleuré une fois. Plus jamais." },
  // Adulte
  { title: "L'autre", body: "Elle te ressemblait. Tu n'as pas écouté. Personne n'a écouté." },
  { title: "Le sabotage", body: "Tu l'as fait. Tu as eu la promotion. Tu te demandes encore qui était le saboté." },
  { title: "La pollution", body: "Tu as parlé. Tu as perdu ton emploi. Tu te demandes si Dieu était fier." },
  { title: "La trahison", body: "Tu as pardonné. Tu as eu raison. Mais tu y as repensé tous les jours." },
  { title: "L'ado", body: "Tu l'as défendu. Il t'a haï quand même. C'était mérité, peut-être." },
  { title: "Le parent malade", body: "Tu l'as accueilli. Tu l'as soigné. Tu as compris pourquoi tu existais." },
  { title: "La crise", body: "Tu as donné. Tu as donné encore. Tu as eu peur, mais tu as donné." },
  { title: "La cause perdue", body: "Tu as continué. Personne n'a remarqué. C'était bien." },
  { title: "La reconversion", body: "Tu as sauté. Tu n'as pas regretté. Tu as eu raison une fois." },
  { title: "La campagne", body: "Tu as mené. Tu as aidé. Tu n'as pas eu de prix. Tu n'en voulais pas." },
  // Combat / cercles
  { title: "Cléopâtre", body: "Elle t'a regardé comme tu regardais tes amants. Tu as compris." },
  { title: "Cerbère", body: "Il a aboyé. Trois bouches, trois faims. Tu as donné ce que tu pouvais." },
  { title: "Plutos", body: "L'or pesait. Tu as enfin lâché. C'était trop tard." },
  { title: "Phlégias", body: "Le fleuve bouillait. Tu te reconnaissais dans chaque cri." },
  { title: "Acédie", body: "Elle t'a demandé de t'asseoir. Tu te demandes encore pourquoi tu as résisté." },
  { title: "Sœurs d'Envie", body: "Elles te ressemblaient. Tu as tué la version de toi qui te jalousait." },
  { title: "Lucifer", body: "Il s'est incliné en premier. Tu t'es senti petit." },
  // Phase profil
  { title: "Le Saint", body: "On t'a élevé. Tu as eu peur de retomber. Tu n'es jamais redescendu." },
  { title: "Le Damné", body: "On t'a abaissé. Tu as eu peur de remonter. Tu es resté." },
  { title: "Le Tiède", body: "On t'a oublié. Tu n'as rien dit. C'était bien aussi." },
  { title: "Le Rebelle", body: "On t'a relâché. Tu n'as rien voulu prouver. C'était plus dur." },
  // Vie générique
  { title: "Premier matin", body: "Tu te souviens du soleil. Du goût du lait. Tu n'avais peur de rien." },
  { title: "Premier amour", body: "Tu t'es promis l'éternité. Tu as été honnête à ce moment-là." },
  { title: "Premier deuil", body: "Tu as appris que la peur n'avait pas de fond." },
  { title: "Le chien", body: "Il s'appelait simplement. Tu l'aimais. Tu l'as enterré." },
  { title: "La maison vide", body: "Un soir, tu as compris qu'elle ne reviendrait pas." },
  { title: "Le miroir", body: "Tu t'es vu vieux. Tu as souri quand même." },
  { title: "Les enfants", body: "Tu leur as menti aussi. Pour les protéger. Pour toi." },
  { title: "L'argent", body: "Tu en as eu beaucoup. Tu as compris qu'il ne suffisait pas." },
  { title: "La maladie", body: "Tu as su. Tu n'as rien dit pendant des semaines." },
  { title: "La fin", body: "Tu as fermé les yeux. Tu n'as pas eu peur. Tu l'avais fait avant." },
  // Plus court
  { title: "Le pain", body: "Le simple plaisir du pain. Tu l'avais oublié." },
  { title: "La pluie", body: "Tu as marché sous la pluie. C'était assez." },
  { title: "Un café", body: "Le bruit de la cuillère. Le bruit du monde." },
  { title: "Une main", body: "Tu as serré. On a serré en retour. Ce jour-là tu étais sauvé." },
  { title: "Un chant", body: "Tu l'as entendu. Tu as su pourquoi tu étais là." },
  { title: "Le silence", body: "Long. Plein. Insupportable. Et puis non." },
  { title: "Un livre", body: "Tu l'as fini. Tu as pleuré. Tu n'as pas su dire pourquoi." },
  { title: "L'horizon", body: "Tu l'as regardé une dernière fois. Il était assez." },
  { title: "Le pardon", body: "Tu l'as donné. Tu ne l'as pas reçu. C'était égal." },
  { title: "L'oubli", body: "Tu as oublié son visage. Tu as gardé le geste." },
  // 60 → 100 : court, évocateur
  { title: "Une tasse", body: "Posée sur la table. Vide. Pleine de toi." },
  { title: "L'enfant qui a couru", body: "Vers toi. Sans raison. Cette nuit-là tu as dormi." },
  { title: "L'ami absent", body: "Tu n'as pas appelé. Il est parti. Tu y penses encore." },
  { title: "Le bus", body: "Le 38, à 17h12. Tu t'es endormi. Personne n'a remarqué." },
  { title: "Le chat", body: "Il s'asseyait. Tu lui parlais. Il t'écoutait." },
  { title: "Une fenêtre", body: "Ouverte. Le rideau bougeait. C'était assez." },
  { title: "La gare", body: "Tu n'as pris aucun train. Tu y es resté longtemps." },
  { title: "Le quai", body: "Il pleuvait. Tu n'avais pas de raison de rentrer." },
  { title: "Une chanson", body: "Tu l'as entendue dans une voiture. Tu t'es arrêté." },
  { title: "Le cimetière", body: "Tu n'es pas entré. C'était comme entrer." },
  { title: "Une lettre jamais ouverte", body: "Tu l'as tournée dans tes mains. Tu l'as remise." },
  { title: "Un visage", body: "Dans la foule. Tu as cru que c'était lui. Ce n'était pas lui." },
  { title: "L'aube", body: "Tu ne dormais pas. Le ciel s'est ouvert. Tu as souri." },
  { title: "Le crépuscule", body: "Le ciel rouge. Tu te souvenais de quelque chose." },
  { title: "Le pas", body: "Léger. Hésitant. Le tien." },
  { title: "Une voix", body: "Tu ne savais pas qui parlait. Mais tu écoutais." },
  { title: "Un mot", body: "Mal écrit. Trop direct. Tu l'as gardé." },
  { title: "Une promesse", body: "Faite. Tenue. Personne n'a su." },
  { title: "Un secret", body: "Gardé. Précieux. Inutile." },
  { title: "Un geste", body: "Une main posée. Tu n'as pas oublié." },
  { title: "Un regard", body: "Pas plus. Mais ça a suffi." },
  { title: "Le pardon refusé", body: "Tu l'as imploré. Tu es parti. Tu n'es jamais rentré." },
  { title: "La porte fermée", body: "Tu as frappé. Tu as attendu. Tu es parti." },
  { title: "L'étreinte", body: "Ferme. Brève. Suffisante." },
  { title: "Le rire", body: "Plus jamais le même après ce jour-là." },
  { title: "Les larmes", body: "Pas pour toi. Pour quelqu'un. C'était bien." },
  { title: "Le sourire", body: "Forcé. Vrai au bout. Vrai au final." },
  { title: "La voix", body: "Plus jeune que toi. Plus sage que toi." },
  { title: "L'écho", body: "Tu as parlé. Le silence a répondu. C'était assez." },
  { title: "Le poème", body: "Tu l'as appris. Tu l'as oublié. Il revenait au mauvais moment." },
  { title: "La chanson de berceuse", body: "Pour quelqu'un d'autre. Pour toi à la fin." },
  { title: "L'étoile", body: "Une seule. Suffisante." },
  { title: "Le vent", body: "Tu l'as entendu. Tu n'as pas eu peur." },
  { title: "Une marche", body: "Pas de but. Juste la marche. Juste assez." },
  { title: "Un musée", body: "Une statue. Tu y as pensé pendant des semaines." },
  { title: "Une pierre", body: "Tu l'as ramassée. Tu l'as gardée. Tu l'as perdue." },
  { title: "Le coquillage", body: "Tu y entendais la mer. Tu te souvenais." },
  { title: "L'odeur du pain", body: "Ce matin-là. Tu n'avais besoin de rien d'autre." },
  { title: "Un pas dans la neige", body: "Le tien. Le seul." },
  { title: "Le soleil derrière les nuages", body: "Présent quand même. Comme toi." },
];

// C.1 — débloque une page (par victoire / event / fin)
export function unlockCodexPage(ending: Ending | null = null): CodexPage | null {
  const idx = GameState.codexPages;
  if (idx >= CODEX_FRAGMENTS.length) return null;
  const fragment = CODEX_FRAGMENTS[idx];
  const page: CodexPage = {
    id: idx,
    ...fragment,
    ending,
    unlockedAt: new Date().toISOString(),
  };
  // Persiste contenu page
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    const all: CodexPage[] = raw ? JSON.parse(raw) : [];
    all.push(page);
    localStorage.setItem(CODEX_KEY, JSON.stringify(all));
  } catch {}
  addCodexPage();
  return page;
}

export function loadCodexPages(): CodexPage[] {
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
