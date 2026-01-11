/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        card: 'var(--bg-card)',
        secondary: 'var(--bg-secondary)',
        primary: 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border-color)',
        accent: 'var(--primary)',
        'accent-hover': 'var(--primary-hover)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
