/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'var(--color-border)' /* subtle brown border */,
        input: 'var(--color-input)' /* subtle cream */,
        ring: 'var(--color-ring)' /* warm terracotta */,
        background: 'var(--color-background)' /* warm off-white */,
        foreground: 'var(--color-foreground)' /* deep espresso brown */,
        primary: {
          DEFAULT: 'var(--color-primary)' /* warm terracotta */,
          foreground: 'var(--color-primary-foreground)' /* white */,
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)' /* saddle brown */,
          foreground: 'var(--color-secondary-foreground)' /* white */,
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)' /* crimson red */,
          foreground: 'var(--color-destructive-foreground)' /* white */,
        },
        muted: {
          DEFAULT: 'var(--color-muted)' /* subtle cream */,
          foreground: 'var(--color-muted-foreground)' /* medium brown */,
        },
        accent: {
          DEFAULT: 'var(--color-accent)' /* chocolate orange */,
          foreground: 'var(--color-accent-foreground)' /* white */,
        },
        popover: {
          DEFAULT: 'var(--color-popover)' /* subtle cream */,
          foreground: 'var(--color-popover-foreground)' /* deep espresso brown */,
        },
        card: {
          DEFAULT: 'var(--color-card)' /* subtle cream */,
          foreground: 'var(--color-card-foreground)' /* deep espresso brown */,
        },
        success: {
          DEFAULT: 'var(--color-success)' /* forest green */,
          foreground: 'var(--color-success-foreground)' /* white */,
        },
        warning: {
          DEFAULT: 'var(--color-warning)' /* bright orange */,
          foreground: 'var(--color-warning-foreground)' /* white */,
        },
        error: {
          DEFAULT: 'var(--color-error)' /* crimson red */,
          foreground: 'var(--color-error-foreground)' /* white */,
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)' /* 6px */,
        md: 'var(--radius-md)' /* 12px */,
        lg: 'var(--radius-lg)' /* 18px */,
        xl: 'var(--radius-xl)' /* 24px */,
      },
      fontFamily: {
        heading: ['Sarabun', 'serif'],
        body: ['Sarabun', 'sans-serif'],
        caption: ['Sarabun', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
        144: '36rem',
      },
      maxWidth: {
        '70ch': '70ch',
      },
      zIndex: {
        100: '100',
        200: '200',
        300: '300',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
};
