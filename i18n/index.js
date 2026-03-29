import * as Localization from "expo-localization";
import { fr, en } from "./translations";

const DICTS = { fr, en };

function resolveLang() {
  const code = Localization.getLocales()[0]?.languageCode ?? "fr";
  return code === "en" ? "en" : "fr";
}

/**
 * Langue UI : anglais si la locale système est `en`, sinon français (défaut produit).
 */
export function getAppLanguage() {
  return resolveLang();
}

/**
 * Traduction par clé. Placeholders : `{name}` remplacés via le 2e argument.
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 */
export function t(key, params) {
  const lang = resolveLang();
  const dict = DICTS[lang] ?? DICTS.fr;
  let s = dict[key] ?? DICTS.fr[key] ?? key;
  if (params && typeof s === "string") {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/** Nombre de messages motivation aléatoires (index 0 … count-1). */
export const MOTIVATION_MESSAGE_COUNT = 20;
