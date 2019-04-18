module.exports = {
  setupFiles: ['<rootDir>/enzyme.config.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  modulePathIgnorePatterns: ['<rootDir>/public/javascripts/lib'],
  moduleNameMapper: {
    '^.+\\.(css|less)$': '<rootDir>/public/javascripts/src/react/common/CSSStub.js'
  }
}
