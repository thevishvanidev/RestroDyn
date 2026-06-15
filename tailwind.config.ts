import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          orange: '#ff6b35',
          blue: '#00d4ff',
          purple: '#a855f7',
        },
        cyber: {
          dark: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a24',
          border: '#2a2a3a',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;