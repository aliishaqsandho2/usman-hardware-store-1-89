
export const generateSKU = (productName: string): string => {
  if (!productName.trim()) {
    return '';
  }

  // Convert to uppercase, remove special characters, and take first 3 words
  const cleanName = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 3) // Take first 3 words
    .join('');

  // Generate a random 3-digit number
  const randomNumber = Math.floor(Math.random() * 900) + 100;

  // Combine name abbreviation with random number
  const sku = `${cleanName.substring(0, 6)}${randomNumber}`;
  
  return sku;
};
