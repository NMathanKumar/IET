/**
 * Jest unit test configuration (jsdom).
 * Uses the already-installed babel-jest presets; no root Babel config so the Vite build is unaffected.
 * Path aliases mirror tsconfig.json "paths".
 */
const path = require('path');

const aliases = [
  'components',
  'context',
  'hooks',
  'styles',
  'assets',
  'services',
  'routes',
  'pages',
  'utils',
  'layouts',
  'types',
];

const aliasMapper = Object.fromEntries(
  aliases.flatMap((name) => [
    [`^@${name}$`, `<rootDir>/src/${name}`],
    [`^@${name}/(.*)$`, `<rootDir>/src/${name}/$1`],
  ])
);

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/integration/'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setup.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
        // <rootDir> is not expanded inside transformer options, so resolve an absolute path
        plugins: [path.join(__dirname, 'tests/jest/importMetaEnv.cjs')],
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/jest/fileStub.cjs',
    '\\.(svg|png|jpe?g|gif|webp)$': '<rootDir>/tests/jest/fileStub.cjs',
    ...aliasMapper,
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.d.ts'],
};
