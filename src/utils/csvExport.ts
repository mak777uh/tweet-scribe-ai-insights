
export const convertTwitterDataToCsv = (data: any[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Extract all possible keys from the first 5 items (or all items if fewer)
  const sampleSize = Math.min(5, data.length);
  const keys = new Set<string>();
  
  for (let i = 0; i < sampleSize; i++) {
    const item = data[i];
    Object.keys(item).forEach(key => {
      if (key !== 'user' && key !== 'media') {
        keys.add(key);
      }
    });
    
    // Add user fields with 'user_' prefix
    if (item.user) {
      Object.keys(item.user).forEach(key => {
        keys.add(`user_${key}`);
      });
    }
  }

  // Convert Set to Array and sort alphabetically
  const headers = Array.from(keys).sort();
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Create CSV data rows
  data.forEach(item => {
    const row = headers.map(header => {
      let value = '';
      
      if (header.startsWith('user_')) {
        // Extract from user object
        const userKey = header.substring(5); // Remove 'user_' prefix
        value = item.user?.[userKey] ?? '';
      } else {
        // Direct field
        value = item[header] ?? '';
      }
      
      // Format value for CSV
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else {
        return String(value);
      }
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

export const downloadCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
