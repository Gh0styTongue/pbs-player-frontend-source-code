/**
 * Helper function for converting hex colors to RGBA.
 */
export const getRGBA = (hexColor: string, opacity: number): string => {
  // check for shorthand hex
  const hex =
    hexColor.length === 3
      ? hexColor
          .split('')
          .map((char) => {
            return char + char;
          })
          .join('')
      : hexColor;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = opacity / 100;
  const result = `rgba(${r},${g},${b},${a})`;
  return result;
};

export const getRGBAVideoJs = (hexColor: string, opacity: number): string => {
  const withoutHash = hexColor.slice(1);
  const hex = withoutHash
    .split('')
    .map((char) => {
      return char + char;
    })
    .join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = opacity;
  const result = `rgba(${r},${g},${b},${a})`;
  return result;
};
