export function dirtyValuesChecker<T extends object>(
  initial: T,
  current: T
): boolean {
  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(initial, key)) continue;

    const initialVal = (initial as any)[key];
    const currentVal = (current as any)[key];

    if (typeof initialVal === "object" && typeof currentVal === "object") {
      if (dirtyValuesChecker(initialVal, currentVal)) return true;
    } else if (String(initialVal) !== String(currentVal)) {
      return true;
    }
  }
  return false;
}
