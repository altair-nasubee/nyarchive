/** 猫の種類プリセット。任意文字列も許容するため、あくまで候補。 */
export const BREED_PRESETS = [
  "茶トラ",
  "キジトラ",
  "サバトラ",
  "ハチワレ",
  "ミケ",
  "サビ",
  "シロ",
  "クロ",
  "ブチ",
] as const;

export type BreedPreset = (typeof BREED_PRESETS)[number];
