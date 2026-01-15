/**
 * Helper function for processing chapter titles in content service that are
 * a number followed by a period — e.g., "1."
 */
export const formatChapterTitle = (title: string): string => {
  // match only titles with one or more digits followed by period
  const reg = /^\d+\.$/;

  return reg.test(title) ? title.slice(0, -1) : title;
};
