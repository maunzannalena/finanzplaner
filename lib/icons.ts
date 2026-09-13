/** Pick a friendly emoji for a fixed cost by its name. */
const ICONS: [RegExp, string][] = [
  [/miete|rent|wohn/i, "🏠"],
  [/strom|gas|wasser|neben|util|energ/i, "💡"],
  [/metro|bahn|bus|ticket|transport|auto|car/i, "🚇"],
  [/handy|phone|internet|wifi|netz/i, "📱"],
  [/versicher|insur/i, "🛡️"],
  [/netflix|spotify|abo|subscr|stream/i, "📺"],
  [/sport|gym|fitness/i, "🏋️"],
];

export function iconFor(name: string, fallback = "🧾"): string {
  return ICONS.find(([re]) => re.test(name))?.[1] ?? fallback;
}
