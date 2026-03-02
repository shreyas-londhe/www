import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import rehypeExternalLinks from "rehype-external-links";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: "https://shreyaslondhe.xyz",
  integrations: [sitemap(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: "static",
  adapter: vercel(),
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      rehypeKatex,
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noreferrer"],
        },
      ],
    ],
  },
});
