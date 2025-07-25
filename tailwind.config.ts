import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'machine-beverage': '#3B82F6',
        'machine-food': '#F97316',
        'machine-ice': '#06B6D4',
        'machine-tobacco': '#92400E',
        'machine-other': '#6B7280',
        'status-operating': '#10B981',
        'status-out-of-order': '#EF4444',
        'status-maintenance': '#F59E0B',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config