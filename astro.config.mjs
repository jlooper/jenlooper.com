import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  site: 'https://jenlooper.com',
  integrations: [mdx(), svelte(), vue()],
  markdown: {
    shikiConfig: {
      theme: 'nord'
    },
    remarkPlugins: ['remark-gfm', 'remark-smartypants'],
    rehypePlugins: [['rehype-external-links', {
      target: '_blank'
    }]]
  }
});
