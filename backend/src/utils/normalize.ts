export const normalizeName = (input: string): string => {
  return input.toLowerCase().replace(/\s+/g, '');
};
