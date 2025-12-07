/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Include all necessary file extensions
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Open Sans', 'sans-serif'],
    },
    extend: {
      // 8pt spacing grid system
      spacing: {
        '0.5': '2px',   // 2px
        '1': '4px',     // 4px
        '1.5': '6px',   // 6px
        '2': '8px',     // 8px
        '2.5': '10px',  // 10px
        '3': '12px',    // 12px
        '3.5': '14px',  // 14px
        '4': '16px',    // 16px
        '5': '20px',    // 20px
        '6': '24px',    // 24px
        '7': '28px',    // 28px
        '8': '32px',    // 32px
        '10': '40px',   // 40px
        '12': '48px',   // 48px
        '14': '56px',   // 56px
        '16': '64px',   // 64px
        '20': '80px',   // 80px
        '24': '96px',   // 96px
        '28': '112px',  // 112px
        '32': '128px',  // 128px
      },
      
      // 60:30:10 Color System
      colors: {
        // Primary (60%) - Orange brand colors
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Main brand orange
          600: '#ea580c',  // Primary CTA
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        
        // Secondary (30%) - Complementary blues and grays
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',  // Main secondary
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        
        // Accent (10%) - Success, warning, error states
        'accent-success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'accent-warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'accent-error': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      
      // Typography hierarchy
      fontSize: {
        // H1 - Hero titles
        'h1': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h1-mobile': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        
        // H2 - Section headers
        'h2': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'h2-mobile': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        
        // H3 - Subsection headers
        'h3': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'h3-mobile': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        
        // Body text
        'body': ['1rem', { lineHeight: '1.75rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.875rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '0em', fontWeight: '400' }],
        
        // Caption text
        'caption': ['0.75rem', { lineHeight: '1.25rem', letterSpacing: '0.025em', fontWeight: '400' }],
        'caption-bold': ['0.75rem', { lineHeight: '1.25rem', letterSpacing: '0.025em', fontWeight: '600' }],
      },
      
      // Border radius consistency
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      
      // Shadow system
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 32px 0 rgba(0, 0, 0, 0.16)',
        'colored': '0 4px 16px 0 rgba(249, 115, 22, 0.2)',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-and-scale': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out forwards',
        'fade-and-scale': 'fade-and-scale 0.5s ease-in-out forwards',
        'slide-in': 'slide-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
