module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "tsconfig.test.json",
    }],
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/migrations/**",
    "!src/jobs/worker.ts",
    "!src/server.ts",
  ],
  coverageThreshold: {
    global: {
      lines:     70,
      functions: 70,
      branches:  60,
    },
  },
};