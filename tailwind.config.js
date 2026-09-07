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
        /* PLCBO dark cut — the tokens the site actually designs against */
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          2: 'hsl(var(--ink-2))',
          3: 'hsl(var(--ink-3))',
        },
        violet: {
          DEFAULT: 'hsl(var(--accent))',
          fill: 'hsl(var(--accent-fill))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      /* One face for the whole site — display, body and the label voice that used to
         be mono. The fallbacks differ per role because they are what a reader sees
         while the font loads, or if it never does: a condensed grotesque behind the
         first two, a real monospace behind the third so the rails and the form
         labels keep their rhythm rather than collapsing. */
      fontFamily: {
        display: ['"OPTI Univers"', '"Arial Narrow"', 'Helvetica', 'system-ui', 'sans-serif'],
        sans: ['"OPTI Univers"', '"Arial Narrow"', '-apple-system', 'BlinkMacSystemFont', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"OPTI Univers"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /* `tracking-tight` is Tailwind's -0.025em, set for a normal-width grotesque.
         Univers 67 is condensed — the letters are already close, and pulling them
         tighter fills the counters in and turns the display sizes into a wall. Zero
         here retunes every `tracking-tight` on the site at once, which is why the
         headings use the scale rather than one-off bracket values. */
      letterSpacing: {
        tight: '0em',
      },
      /* Two steps past the heading scale, for the three places the body is meant to
         shout: the pinned intro sentence, the work index and the contact address.
         Named rather than repeated as bracket clamps so they stay one decision. */
      fontSize: {
        mega: ['clamp(2.75rem, 8vw, 7rem)', { lineHeight: '0.94' }],
        index: ['clamp(2rem, 6vw, 5rem)', { lineHeight: '1' }],
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
