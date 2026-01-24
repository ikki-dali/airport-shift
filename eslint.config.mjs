import nextConfig from 'eslint-config-next'

const config = [
  ...nextConfig,
  {
    rules: {
      // 既存コードに多数のtry/catch利用あり。段階的に修正予定。
      'react-hooks/error-boundaries': 'warn',
      // 既存コードの変数宣言順序問題。段階的に修正予定。
      'react-hooks/immutability': 'warn',
      // eslint.config.mjs自体への警告を抑制
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    ignores: ['**/*.test.ts'],
  },
]

export default config
