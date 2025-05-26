export function formatDate(date: string | Date) {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formattedDate;
} 