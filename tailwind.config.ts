import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,edge,html}"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['"Roboto"', "serif"],
        montserrat: ['"Montserrat"', "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
