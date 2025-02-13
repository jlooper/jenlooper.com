import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';
import icon from "astro-icon";
import netlify from "@astrojs/netlify"; 

// https://astro.build/config
export default defineConfig({
  site: "https://jenlooper.com",
  compressHTML: true,
  //output: "server",
  integrations: [mdx(), icon(), tailwind({
    applyBaseStyles: false
  }), compress(), pagefind()],
  //output: "server",
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
      }
    ],
    formats: ['webp', 'avif', 'png', 'jpg', 'jpeg', 'gif'],
  },
});

