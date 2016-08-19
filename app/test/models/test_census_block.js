/* global describe it, before */
var expect = require('chai').expect
var test_utils = require('./test_utils')
var request = test_utils.request

describe('CensusBlock', () => {
  before(() => test_utils.loginApp())

  describe('#findByStatefpAndCountyfp', () => {
    var statefp = '36'
    var countyfp = '061'

    it('should return a feature collection', (done) => {
      request
        .get('/census_blocks/' + statefp + '/' + countyfp)
        .query(test_utils.testViewport())
        .accept('application/json')
        .end((err, res) => {
          if (err) return done(err)
          var output = res.body
          expect(res.statusCode).to.be.equal(200)
          expect(output.feature_collection).to.have.property('type', 'FeatureCollection')
          expect(output.feature_collection.features).to.have.length.above(0)

          var first_feature = output.feature_collection.features[0]
          expect(first_feature.geometry.type).to.equal('MultiPolygon')
          expect(first_feature.geometry.coordinates).to.have.length.above(0)
          done()
        })
    })
  })
})
