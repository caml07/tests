
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  define: { __DEV__: true },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['tmp/**', 'node_modules/**'],
    server: {
      deps: {
        inline: ['@testing-library/react-native'],
      },
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, '.') },
      { find: /^react-native$/, replacement: path.resolve(__dirname, '__mocks__', 'react-native', 'index.js') },
      { find: /^react-native\//, replacement: path.resolve(__dirname, '__mocks__', 'react-native') },
      { find: '@react-native/virtualized-lists', replacement: path.resolve(__dirname, '__mocks__', 'react-native-virtualized-lists', 'index.js') },
    ],
  },
})

