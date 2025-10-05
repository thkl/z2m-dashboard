export function filterData<T>(
  data: T[],
  searchText: string,
  searchableFields: (item: T) => any[]
): T[] {
  if (!searchText || searchText.trim() === '') return data;

  const lowerSearchText = searchText.toLowerCase().trim();

  return data.filter(item => {
    const fields = searchableFields(item);
    return fields.some(field => {
      if (field == null) return false;
      return String(field).toLowerCase().includes(lowerSearchText);
    });
  });
}
