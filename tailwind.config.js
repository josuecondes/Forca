/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo muy oscuro y profundo
        primary: '#1A1A24',
        surface: '#22222E',
        inputBg: '#252533',
        // Neón
        accent: '#16a34a', // Verde del botón "Iniciar sesión"
        accentGlow: '#22c55e',
        secondary: '#f97316', // Naranja resplandeciente
        // Textos
        textMain: '#FFFFFF',
        textMuted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Poppins', 'Montserrat', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
