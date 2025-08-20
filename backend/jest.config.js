module.exports = {
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.js"],
    collectCoverageFrom: [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**",
      "!jest.config.js",
      "!server.js",
      "!swagger.js",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
    testTimeout: 30000,
    globalSetup: '<rootDir>/__tests__/globalSetup.js',
    globalTeardown: '<rootDir>/__tests__/globalTeardown.js',
  }