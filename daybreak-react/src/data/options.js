/* Shared option lists for signup + settings (replace with your own or an API). */
export const COUNTRIES = [
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
];

export const REGIONS = {
  AU: ['New South Wales', 'Queensland', 'South Australia', 'Victoria', 'Western Australia'],
  CA: ['Alberta', 'British Columbia', 'Ontario', 'Quebec'],
  IN: ['Delhi', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'West Bengal'],
  GB: ['England', 'Northern Ireland', 'Scotland', 'Wales'],
  US: ['California', 'Florida', 'New York', 'Texas', 'Washington'],
};

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { value: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'es', label: 'Spanish', native: 'Español' },
  { value: 'fr', label: 'French', native: 'Français' },
];

export const TOPICS = ['World', 'Business', 'Technology', 'Sports', 'Science', 'Health', 'Entertainment', 'Travel', 'Education', 'Environment']
  .map((label) => ({ value: label.toLowerCase(), label }));

export const CATEGORIES = TOPICS.map((t) => t.label);
