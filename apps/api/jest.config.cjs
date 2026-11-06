/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  // La suite de contrato necesita Docker: se corre aparte con `pnpm test:contrato`.
  testPathIgnorePatterns: ['\\.contrato\\.spec\\.ts$'],
};
