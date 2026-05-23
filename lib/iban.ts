export function generateIban(): string {
  const digits2 = Math.floor(Math.random() * 90 + 10).toString()
  const digits16 = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')
  return `AL${digits2}${digits16}`
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}
