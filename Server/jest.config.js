export default {
  // Use ESM modules
  transform: {},
  extensionsToTreatAsEsm: [],
  
  // Test file pattern
  testMatch: ['**/__tests__/**/*.test.js'],
  
  // Timeout (model tests are fast, but memory server startup needs time)
  testTimeout: 30000,
  
  // Force exit after tests complete (prevents hanging)
  forceExit: true,
  detectOpenHandles: true,
};