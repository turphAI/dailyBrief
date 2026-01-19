/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'hsl(var(--foreground))',
            h1: {
              color: 'hsl(var(--foreground))',
              fontWeight: '700',
              fontSize: '1.875rem',
              marginTop: '1.5rem',
              marginBottom: '1rem',
            },
            h2: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.5rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            h3: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1.25rem',
              marginBottom: '0.5rem',
            },
            h4: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.125rem',
            },
            p: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              lineHeight: '1.75',
            },
            a: {
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            strong: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            code: {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
              border: '1px solid hsl(var(--border))',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              fontWeight: '400',
              fontSize: '0.875rem',
            },
            ul: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              paddingLeft: '1.5rem',
            },
            ol: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              paddingLeft: '1.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            blockquote: {
              borderLeftColor: 'hsl(var(--border))',
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: 'hsl(var(--muted-foreground))',
            },
            hr: {
              borderColor: 'hsl(var(--border))',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            table: {
              width: '100%',
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            thead: {
              borderBottomColor: 'hsl(var(--border))',
              borderBottomWidth: '1px',
            },
            'thead th': {
              fontWeight: '600',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            },
            'tbody tr': {
              borderBottomColor: 'hsl(var(--border))',
              borderBottomWidth: '1px',
            },
            'tbody td': {
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
