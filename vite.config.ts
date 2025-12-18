import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { createHash } from "crypto";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Generate version hash for cache busting
  const buildTime = new Date().toISOString();
  const versionHash = createHash('md5').update(buildTime).digest('hex').substring(0, 8);

  return {
    define: {
      // Explicitly define environment variables for the browser
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    server: {
      host: "localhost",
      port: 7351,
      strictPort: true, // Fail if port is already in use
      hmr: {
        port: 7351,
        host: "localhost",
        clientPort: 7351
      },
      fs: {
        allow: ['..', process.cwd()]
      },
      watch: {
        usePolling: false,
        interval: 100
      }
    },
    optimizeDeps: {
      // Include Supabase dependencies for proper bundling
      include: [
        '@supabase/supabase-js',
        '@supabase/postgrest-js'
      ],
      // Exclude problematic directories from scanning
      exclude: [
        'server/*',
        'supabase/*',
        'scripts/*'
      ]
    },
    // Exclude problematic HTML files from entry points
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      // Performance optimizations
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          // Optimize chunk naming for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          
          manualChunks: {
            // Core frameworks
            vendor: ['react', 'react-dom', 'react-router-dom'],

            // Database
            supabase: ['@supabase/supabase-js', '@supabase/postgrest-js'],

            // UI Libraries - Radix UI components
            'ui-radix': [
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-progress',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-tooltip',
            ],

            // Animation
            'animation': ['framer-motion'],

            // Icons
            'icons': ['lucide-react', 'react-icons'],

            // Utilities
            'utils': [
              'date-fns',
              'clsx',
              'class-variance-authority',
              'tailwind-merge',
            ],

            // Charts and visualization
            'charts': ['recharts'],

            // Other libraries
            'libs': [
              '@tanstack/react-query',
            ],
          }
        }
      }
    },
    plugins: [
      react(),
      visualizer({
        filename: './dist/stats.html',
        open: false, // Set to true to auto-open in browser
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'sunburst', 'treemap', 'network'
      }),
      // Custom plugin to inject version info
      {
        name: 'inject-version',
        transformIndexHtml(html) {
          return html.replace(
            '<head>',
            `<head>\n    <meta name="app-version" content="${versionHash}" />\n    <meta name="build-time" content="${buildTime}" />`
          );
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/integrations/supabase/client": path.resolve(__dirname, "./src/integrations/supabase/client.ts"),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
  };
});
