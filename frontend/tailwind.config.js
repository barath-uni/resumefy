/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Orange/Teal Vibrant Palette
        'orange_peel': {
          DEFAULT: '#ff9f1c',
          100: '#382100',
          200: '#704100',
          300: '#a86200',
          400: '#e08300',
          500: '#ff9f1c',
          600: '#ffb347',
          700: '#ffc675',
          800: '#ffd9a3',
          900: '#ffecd1'
        },
        'hunyadi_yellow': {
          DEFAULT: '#ffbf69',
          100: '#482900',
          200: '#915200',
          300: '#d97b00',
          400: '#ffa023',
          500: '#ffbf69',
          600: '#ffcc89',
          700: '#ffd9a6',
          800: '#ffe5c4',
          900: '#fff2e1'
        },
        'mint_green': {
          DEFAULT: '#cbf3f0',
          100: '#114844',
          200: '#229088',
          300: '#3ad1c7',
          400: '#81e2db',
          500: '#cbf3f0',
          600: '#d4f5f3',
          700: '#dff7f6',
          800: '#eafaf9',
          900: '#f4fcfc'
        },
        'light_sea_green': {
          DEFAULT: '#2ec4b6',
          100: '#092724',
          200: '#124e48',
          300: '#1b746c',
          400: '#249b8f',
          500: '#2ec4b6',
          600: '#50d6c9',
          700: '#7ce0d6',
          800: '#a7eae4',
          900: '#d3f5f1'
        },

        // ShadCN CSS Variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        'heading': ['Plus Jakarta Sans', 'Poppins', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}