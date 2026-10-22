// Urutan warna kartu, diputar per item.
export const POP_COLORS = ['pop-pink', 'pop-orange', 'pop-teal', 'pop-blue', 'pop-yellow'] as const
export const popColor = (i: number) => POP_COLORS[i % POP_COLORS.length]
