import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        border: "#E6E6E6",
        input: "#E6E6E6",
        ring: "#0747A1",
        background: "#FFFFFF",
        foreground: "#1A1A1A",
        primary: {
          DEFAULT: "#0747A1",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FDB353",
          foreground: "#1A1A1A",
        },
        destructive: {
          DEFAULT: "#FF8181",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#49E0C6",
          foreground: "#1A1A1A",
        },
        surface: "#F9FAFB",
        muted: {
          DEFAULT: "#666666",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#FDB353",
          foreground: "#1A1A1A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
          primary: "#0747A1",
          "primary-foreground": "#FFFFFF",
          accent: "#F9FAFB",
          "accent-foreground": "#1A1A1A",
          border: "#E6E6E6",
          ring: "#0747A1",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
