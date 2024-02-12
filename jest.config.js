module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 30000, // Timeout of 10000 ms for all tests
    testMatch: [
        "**/?(*.)+(spec|test).[j]s?(x)"
    ]
    // Add other configurations as needed
  };