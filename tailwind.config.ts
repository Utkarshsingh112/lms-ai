import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'min-lg': '1024px', // Custom breakpoint for min-lg
        'min-2xl': '1536px', // Custom breakpoint for min-2xl
      },
      colors: {
        'cta': '#2c2c2c',
        'cta-gold': '#fccc41',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config

