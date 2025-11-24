/**
 * Utility functions for URL slug handling
 */

/**
 * Convert a category/subcategory name to a URL-friendly slug
 * @param name - The category or subcategory name
 * @returns URL-friendly slug (lowercase, dashes instead of spaces)
 */
export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .trim();
};

/**
 * Convert a slug back to a search pattern for matching category names
 * @param slug - The URL slug
 * @returns A pattern that can be used to match category names
 */
export const slugToPattern = (slug: string): string => {
  return slug
    .replace(/-/g, ' ') // Replace dashes with spaces
    .toLowerCase();
};

/**
 * Check if a category name matches a slug
 * @param categoryName - The category name to check
 * @param slug - The slug to match against
 * @returns true if they match
 */
export const matchesSlug = (categoryName: string, slug: string): boolean => {
  return createSlug(categoryName) === slug;
};

export default {
  createSlug,
  slugToPattern,
  matchesSlug
};