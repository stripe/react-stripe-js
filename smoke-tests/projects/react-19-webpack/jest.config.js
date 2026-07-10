module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {'\\.[jt]sx?$': 'babel-jest'},
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
};
