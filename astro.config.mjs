import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import sitemap from "@astrojs/sitemap";
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';
import icon from "astro-icon";
import netlify from "@astrojs/netlify";

const site = "https://jenlooper.com";

// https://astro.build/config
export default defineConfig({
  site,
  compressHTML: true,
  integrations: [mdx(), icon(), tailwind({
    applyBaseStyles: false
  }), sitemap({
    // Canonical `loc` values use `site` above; list refreshes on each `astro build`.
    filter: (page) => {
      const path = new URL(page).pathname.replace(/\/$/, "") || "/";
      return path !== "/404" && !path.endsWith("404.html");
    },
    namespaces: {
      news: false,
      xhtml: false,
      image: false,
      video: false,
    },
  }), compress(), pagefind()],
  adapter: netlify(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media2.dev.to'
      },
      {
        protocol: 'https',
        hostname: 'media.giphy.com'
      },
      {
        protocol: 'https',
        hostname: 'thepracticaldev.s3.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      }
    ],
    formats: ['webp', 'avif', 'png', 'jpg', 'jpeg', 'gif'],
  },
});

