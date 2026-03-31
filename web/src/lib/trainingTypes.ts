// Standardized Training Categories for SIDP
// These are the ONLY valid training types across the system.

export const TRAINING_CATEGORIES = [
  {
    value: 'Diklat Fungsional',
    label: 'Diklat Fungsional',
    key: 'fungsional',
    color: '#3b82f6',
    bgLight: 'bg-blue-50',
    bgBadge: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    barColor: 'bg-blue-500',
    barHover: 'hover:bg-blue-600',
    barBorder: 'border-blue-600',
    icon: '📘',
  },
  {
    value: 'Diklat Substantif',
    label: 'Diklat Substantif',
    key: 'substantif',
    color: '#10b981',
    bgLight: 'bg-emerald-50',
    bgBadge: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    barColor: 'bg-emerald-500',
    barHover: 'hover:bg-emerald-600',
    barBorder: 'border-emerald-600',
    icon: '📗',
  },
  {
    value: 'Diklat Sertifikasi',
    label: 'Diklat Sertifikasi',
    key: 'sertifikasi',
    color: '#f97316',
    bgLight: 'bg-orange-50',
    bgBadge: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    barColor: 'bg-orange-500',
    barHover: 'hover:bg-orange-600',
    barBorder: 'border-orange-600',
    icon: '📙',
  },
] as const;

// Extract just the values for validation
export const TRAINING_TYPE_VALUES = TRAINING_CATEGORIES.map(c => c.value);

// Helper to get category config by value
export function getCategoryConfig(trainingType: string) {
  return TRAINING_CATEGORIES.find(c => c.value === trainingType) || TRAINING_CATEGORIES[1]; // default to Substantif
}

// Helper to get category config by key
export function getCategoryByKey(key: string) {
  return TRAINING_CATEGORIES.find(c => c.key === key);
}

// Colors array for charts (in same order as TRAINING_CATEGORIES)
export const CATEGORY_CHART_COLORS = TRAINING_CATEGORIES.map(c => c.color);
