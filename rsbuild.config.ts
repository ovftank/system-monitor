import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
    plugins: [pluginReact()],
    resolve: {
        alias: {
            '@': './src'
        }
    },
    html: {
        title: '‎',
        favicon: './src/assets/favicon.ico'
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    tools: {
        postcss: (opts, { addPlugins }) => {
            addPlugins(tailwindcss);
        }
    }
});
