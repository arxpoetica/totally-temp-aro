/* global describe it */
var expect = require('chai').expect
var request = require('./test_utils').request

describe('Errors', () => {
  it('should return a 500 error', (done) => {
    request
      .get('/error')
      .accept('application/json')
      .end((err, res) => {
        if (err) return done(err)
        var output = res.body
        expect(res.statusCode).to.be.equal(500)
        expect(output.error).to.be.equal('test')
        done()
      })
  })
})
