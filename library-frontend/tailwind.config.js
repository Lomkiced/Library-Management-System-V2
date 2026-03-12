/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Institutional Dark Blue Theme - Primary Color Palette
        primary: {
          50: '#eef3ff',   // Very light blue tint
          100: '#dce6ff',  // Light blue tint
          200: '#b9cdff',  // Lighter blue
          300: '#85a8ff',  // Light blue
          400: '#4a7aff',  // Medium blue
          500: '#1a4dc1',  // Darker blue
          600: '#00008B',  // MAIN: Dark Blue (Institutional)
          700: '#000070',  // Darker shade
          800: '#000058',  // Even darker
          900: '#000040',  // Very dark
          950: '#000028',  // Darkest
        },
        executive: {
          900: '#0b0f19', // Obsidian (Deepest Dark)
          800: '#111827', // Charcoal (Sidebar)
          50: '#F9FAFB',  // Mist (Light Background)
          accent: '#6366F1', // Electric Indigo (Primary Action)
          highlight: '#38BDF8', // Sky Blue (Secondary)
        },
        // Institution secondary colors
        institution: {
          dark: '#00008B',     // Main Dark Blue
          light: '#f0f4f8',    // Light gray for backgrounds
          white: '#ffffff',    // Pure white
          text: '#1e293b',     // Dark gray for text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
