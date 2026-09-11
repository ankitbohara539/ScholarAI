export function formatCurrencyAmount(value: number | string | null, currency: string | null): string {
  if (value === null) return 'Not available'
  const amount = Number(value)
  if (!currency) return `${amount.toLocaleString()} (currency unavailable)`
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
