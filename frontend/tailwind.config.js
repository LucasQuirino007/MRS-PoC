/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        mrs: {
          blue: '#003f88',
          lightblue: '#0071ce',
          gray: '#f4f6f9',
        },
      },
    },
  },
  plugins: [],
};
