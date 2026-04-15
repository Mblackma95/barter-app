export function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export function hasCashLanguage(value: string) {
  return /\b(cash|money|dollars?|bucks?|e-transfer|etransfer|venmo|paypal|stripe|payment|paid|price|\$)\b/i.test(
    value,
  );
}
