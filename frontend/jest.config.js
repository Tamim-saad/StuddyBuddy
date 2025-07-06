// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // for React DOM testing
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest', // use Babel for JSX/JS files
  },
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy', // mock style imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
      '^axios$': '<rootDir>/__mocks__/axiosMock.js',

  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/test-utils.jsx',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  verbose: true,
  testTimeout: 10000, // 10 seconds timeout for tests
  transformIgnorePatterns: [
    'node_modules/(?!(axios|axios-mock-adapter|@react-pdf-viewer)/)',
  ],
};
  