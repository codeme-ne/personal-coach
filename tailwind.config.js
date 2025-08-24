/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        background: "hsl(0, 0%, 100%)", // oklch(1 0 0)
        foreground: "hsl(210, 40%, 14%)", // oklch(0.141 0.005 285.823)
        card: "hsl(0, 0%, 100%)", // oklch(1 0 0)
        "card-foreground": "hsl(210, 40%, 14%)", // oklch(0.141 0.005 285.823)
        popover: "hsl(0, 0%, 100%)", // oklch(1 0 0)
        "popover-foreground": "hsl(210, 40%, 14%)", // oklch(0.141 0.005 285.823)
        primary: "hsl(142, 76%, 36%)", // oklch(0.723 0.219 149.579)
        "primary-foreground": "hsl(144, 61%, 95%)", // oklch(0.982 0.018 155.826)
        secondary: "hsl(210, 40%, 96%)", // oklch(0.967 0.001 286.375)
        "secondary-foreground": "hsl(210, 40%, 20%)", // oklch(0.21 0.006 285.885)
        muted: "hsl(210, 40%, 96%)", // oklch(0.967 0.001 286.375)
        "muted-foreground": "hsl(215, 13.8%, 34.1%)", // oklch(0.552 0.016 285.938)
        accent: "hsl(210, 40%, 96%)", // oklch(0.967 0.001 286.375)
        "accent-foreground": "hsl(210, 40%, 20%)", // oklch(0.21 0.006 285.885)
        destructive: "hsl(0, 84%, 37%)", // oklch(0.577 0.245 27.325)
        border: "hsl(214, 32%, 91%)", // oklch(0.92 0.004 286.32)
        input: "hsl(214, 32%, 91%)", // oklch(0.92 0.004 286.32)
        ring: "hsl(142, 76%, 36%)", // oklch(0.723 0.219 149.579)
        // Chart colors
        chart: {
          1: "hsl(12, 76%, 61%)", // oklch(0.646 0.222 41.116)
          2: "hsl(173, 58%, 39%)", // oklch(0.6 0.118 184.704)
          3: "hsl(197, 37%, 24%)", // oklch(0.398 0.07 227.392)
          4: "hsl(43, 74%, 66%)", // oklch(0.828 0.189 84.429)
          5: "hsl(27, 87%, 67%)", // oklch(0.769 0.188 70.08)
        },
      },
      borderRadius: {
        lg: "0.65rem",
        md: "calc(0.65rem - 2px)",
        sm: "calc(0.65rem - 4px)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
}