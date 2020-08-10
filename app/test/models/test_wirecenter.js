/* global describe it */
var expect = require('chai').expect
var test_utils = require('./test_utils')
var request = test_utils.request

describe('Wirecenter', () => {
  describe('#findAll()', () => {
    it('should return the information of the wirecenter', (done) => {
      request
        .get('/service_areas/wirecenter')
        .query(test_utils.testViewport())
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(res.statusCode).to.be.equal(200)
          expect(output.feature_collection).to.be.an('object')
          expect(output.feature_collection.type).to.be.equal('FeatureCollection')
          expect(output.feature_collection.features).to.be.an('array')
          expect(output.feature_collection.features).to.have.length(24)
          expect(output.feature_collection.features[0].type).to.be.equal('Feature')
          expect(output.feature_collection.features[0].properties).to.be.an('object')
          expect(output.feature_collection.features[0].properties.id).to.be.a('number')
          expect(output.feature_collection.features[0].properties.name).to.be.a('string')
          expect(output.feature_collection.features[0].geometry).to.be.an('object')
          expect(output.feature_collection.features[0].geometry.type).to.be.equal('MultiPolygon')
          done()
        })
    })
  })
})
