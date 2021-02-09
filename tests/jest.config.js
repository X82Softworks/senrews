module.exports = {
    coverageDirectory: '<rootDir>/coverage',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**/*.{js,jsx}'],
    testPathIgnorePatterns: ['tests/setup'],
    globals: {
        __PATH_PREFIX__: ''
    },
    rootDir: '../'
};