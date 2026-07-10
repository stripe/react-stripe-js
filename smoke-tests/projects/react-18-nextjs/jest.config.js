const nextJest = require('next/jest');
const createJestConfig = nextJest({dir: './'});
module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
});
