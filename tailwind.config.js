/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'STSong', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      colors: {
        china: {
          red: '#c02c38',
          ink: '#1c1c1c',
          paper: '#f6f5ec',
          gold: '#c99e10',
          cyan: '#2486b9',
          jade: '#225a1f',
          tea: '#7a7374',
        }
      }
    },
  },
  plugins: [],
}
