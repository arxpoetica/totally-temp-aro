/* global describe it */
var expect = require('chai').expect
var request = require('./test_utils').request

describe('Map', () => {
  it('should return the map page', (done) => {
    request
      .get('/')
      .accept('text/html')
      .end((err, res) => {
        if (err) return done(err)
        expect(res.statusCode).to.be.equal(200)
        done()
      })
  })
})
