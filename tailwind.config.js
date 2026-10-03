/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* the tokens the site actually designs against */
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          2: 'hsl(var(--ink-2))',
          3: 'hsl(var(--ink-3))',
        },
        /* The identity system's accent, restored. Named for what it is rather than
           for the violet it replaces, so nothing reads as a leftover. */
        terracotta: {
          DEFAULT: 'hsl(var(--accent))',
          fill: 'hsl(var(--accent-fill))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      /*  Three faces, three jobs — the structure the reference runs on, and the
          reason it reads as an atelier rather than a template.

          `sans`/`display` is Archivo: the grotesque that does all the structural
          work. `serif` is Bodoni Moda: a true didone, used for the wordmark and the
          two or three accent words a sentence turns on. `script` is Ballet: the
          Spencerian that titles each section.

          All three are OFL. The face they replace, OPTI Univers Sixty Seven, is an
          unlicensed Univers clone that was shipping on a public URL — and Archivo is
          the identity system's own face, so this is a restoration, not a third
          choice. */
      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
        sans: ['Archivo', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['"Bodoni Moda"', 'Didot', '"Bodoni MT"', 'Georgia', 'serif'],
        script: ['Ballet', '"Snell Roundhand"', '"Apple Chancery"', 'cursive'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /* Archivo is a normal-width grotesque, so `tracking-tight` means something
         again — the condensed face that forced this to 0 is gone. The reference sets
         display type at roughly -0.05em, which is what `track-display` applies; this
         is the gentler step for everything below heading size. */
      letterSpacing: {
        tight: '-0.02em',
      },
      /* Two steps past the heading scale, for the three places the body is meant to
         shout: the pinned intro sentence, the work index and the contact address.
         Named rather than repeated as bracket clamps so they stay one decision. */
      fontSize: {
        mega: ['clamp(2.75rem, 7.5vw, 6.5rem)', { lineHeight: '0.95' }],
        index: ['clamp(1.75rem, 4.4vw, 3.75rem)', { lineHeight: '1.04' }],
      },
      transitionTimingFunction: {
        /* the site's one easing curve — a long, late settle */
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      /* the identity scale runs past Tailwind's default; 104px is its last step */
      spacing: { 26: '104px' },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
