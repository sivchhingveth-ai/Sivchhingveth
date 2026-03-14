export const categoryColors: Record<string, { bg: string, text: string, border: string, hex: string }> = {
  health: {
    bg: 'bg-[#00ba7c]/10',
    text: 'text-[#00ba7c]',
    border: 'border-[#00ba7c]/20',
    hex: '#00ba7c'
  },
  hygiene: {
    bg: 'bg-[#7856ff]/10',
    text: 'text-[#7856ff]',
    border: 'border-[#7856ff]/20',
    hex: '#7856ff'
  },
  recovery: {
    bg: 'bg-[#ffd233]/10',
    text: 'text-[#ffd233]',
    border: 'border-[#ffd233]/20',
    hex: '#ffd233'
  },
  body: {
    bg: 'bg-[#f91880]/10',
    text: 'text-[#f91880]',
    border: 'border-[#f91880]/20',
    hex: '#f91880'
  },
  finance: {
    bg: 'bg-[#1d9bf0]/10',
    text: 'text-[#1d9bf0]',
    border: 'border-[#1d9bf0]/20',
    hex: '#1d9bf0'
  },
  learning: {
    bg: 'bg-[#ffad1f]/10',
    text: 'text-[#ffad1f]',
    border: 'border-[#ffad1f]/20',
    hex: '#ffad1f'
  },
  work: {
    bg: 'bg-[#1d9bf0]/10',
    text: 'text-[#1d9bf0]',
    border: 'border-[#1d9bf0]/20',
    hex: '#1d9bf0'
  },
  other: {
    bg: 'bg-[#71767b]/10',
    text: 'text-[#71767b]',
    border: 'border-[#71767b]/20',
    hex: '#71767b'
  },
  routine: {
    bg: 'bg-[#7856ff]/10',
    text: 'text-[#7856ff]',
    border: 'border-[#7856ff]/20',
    hex: '#7856ff'
  }
};

export const getCategoryStyles = (category: string) => {
  return categoryColors[category.toLowerCase()] || categoryColors.other;
};
