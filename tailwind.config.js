/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202a",
        panel: "#f7f8fa",
        line: "#d7dde4"
      }
    }
  },
  plugins: []
};
