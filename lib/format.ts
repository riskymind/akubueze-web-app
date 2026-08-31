// Ported verbatim from the original design's logic script.

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function naira(n: number) {
  return "₦" + Number(n).toLocaleString();
}

export function fmtDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function avatarColorFor(colors: string[], index: number) {
  return colors[index % colors.length];
}
