module.exports = {
  setupFiles: ['<rootDir>/enzyme.config.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  moduleNameMapper: {
    '^.+\\.(css|less)$': '<rootDir>/public/javascripts/src/react/common/CSSStub.js'
  }
}
