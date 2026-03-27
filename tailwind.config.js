/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        'dark-brown': '#2C2420',
        charcoal: '#1A1A1E',
        'off-white': '#E8E4DF',
      },
      fontFamily: {
        literata: ['Literata', 'Georgia', 'serif'],
        atkinson: ['Atkinson Hyperlegible', 'sans-serif'],
        merriweather: ['Merriweather', 'Georgia', 'serif'],
        'ibm-plex': ['IBM Plex Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
