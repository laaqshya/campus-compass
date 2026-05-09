const exceptions = ["and", "of", "the", "in", "at", "to", "a", "an", "for", "on", "by"];

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) =>
      i === 0 || !exceptions.includes(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(" ");
}

export function splitNameToLines(name: string, maxChars = 14): string[] {
  const titled = titleCase(name);
  if (titled.length <= maxChars) return [titled];
  const mid = Math.floor(titled.length / 2);
  let bestSpace = -1;
  for (let i = 0; i < titled.length; i++) {
    if (titled[i] === " " && (bestSpace === -1 || Math.abs(i - mid) < Math.abs(bestSpace - mid))) {
      bestSpace = i;
    }
  }
  if (bestSpace === -1) return [titled];
  return [titled.slice(0, bestSpace), titled.slice(bestSpace + 1)];
}