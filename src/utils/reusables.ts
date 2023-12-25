export const formatChartDate = (date: string) => {
  return new Date(date).toLocaleString('default', {
    day: '2-digit',
    month: 'numeric',
  });
};
