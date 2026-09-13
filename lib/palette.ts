/**
 * Categorical chart palette around the pink accent (pink, gold, mauve, mint,
 * orchid, peach, sky). Order validated for color-vision deficiency: worst
 * adjacent-pair CVD ΔE 8.7, normal-vision ΔE 17.4 on the card surface.
 * Series beyond the last slot fold into "Other".
 */
export const CATEGORY_COLORS = ["#e87da9", "#d4ab4f", "#9372c8", "#59b387", "#cb7fc5", "#e5955d", "#599fd8"];
export const OTHER_COLOR = "#b9a9b3";

/** Deposits / withdrawals in the savings chart: pink and mauve. */
export const SAVINGS_CHART = { deposits: "#e87da9", withdrawals: "#9372c8" };

export function categoryColor(index: number): string {
  return index >= 0 && index < CATEGORY_COLORS.length ? CATEGORY_COLORS[index] : OTHER_COLOR;
}
