export const toTitleCase = (str: string) => {
  return str
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
