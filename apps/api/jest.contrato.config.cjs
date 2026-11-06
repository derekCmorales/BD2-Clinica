/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.contrato.spec.ts'],
  // Los motores no toleran escrituras concurrentes entre workers sobre el mismo esquema.
  maxWorkers: 1,
  testTimeout: 30000,
  reporters: ['default', '<rootDir>/../contrato-reporter.cjs'],
};
