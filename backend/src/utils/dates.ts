export const toIso = (value: Date = new Date()): string => value.toISOString();

export const addHours = (date: Date, hours: number): Date => {
  const copy = new Date(date);
  copy.setHours(copy.getHours() + hours);
  return copy;
};

export const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
