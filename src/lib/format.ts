/** 猫IDを4桁ゼロ埋めの図鑑番号に整形（例: 7 -> "0007"）。 */
export function formatCatId(id: number): string {
  return String(id).padStart(4, "0");
}

/** 誕生日から満年齢を算出。null や未来日付なら null。 */
export function calcAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null;
  const now = new Date();
  if (birthDate.getTime() > now.getTime()) return null;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

/** 年齢の表示文字列。誕生日不明なら「年齢不明」。 */
export function formatAge(birthDate: Date | null | undefined): string {
  const age = calcAge(birthDate);
  return age === null ? "年齢不明" : `${age}歳`;
}

/** 日付を YYYY.MM.DD 表記に。 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** <input type="date"> の value 用に YYYY-MM-DD へ。 */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
