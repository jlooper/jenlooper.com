import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';
import icon from "astro-icon";
import netlify from "@astrojs/netlify"; 

// https://astro.build/config
export default defineConfig({
  site: "https://jenlooper.com",
  compressHTML: true,
  output: "server",
  integrations: [mdx(), icon(), tailwind({
    applyBaseStyles: false
  }), compress()],
  //output: "server",
  adapter: netlify()
});