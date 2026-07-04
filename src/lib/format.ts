export const formatDate = (d: Date, month: 'short' | 'long' = 'short') =>
  d.toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric' })
