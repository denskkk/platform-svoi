export function formatRating(value: any, digits: number = 1): string {
  if (value === null || value === undefined) return (0).toFixed(digits);
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return (0).toFixed(digits);
  return num.toFixed(digits);
}
