module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  transform: {'^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'},
  moduleNameMapper: {'^(\\.{1,2}/.*)\\.js$': '$1'},
};
