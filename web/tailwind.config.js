/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#1e1f22',
          darker: '#111214',
          gray: '#313338',
          lightgray: '#3f4147',
          text: '#dbdee1',
          muted: '#949ba4',
          accent: '#5865f2'
        }
      }
    },
  },
  plugins: [],
}
