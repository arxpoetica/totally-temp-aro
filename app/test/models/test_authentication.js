/* global describe it, before, after */
var expect = require('chai').expect
var test_utils = require('./test_utils')
var request = test_utils.request

describe('Authentication', () => {
  before(() => test_utils.logoutApp())
  after(() => test_utils.loginApp())

  it('should redirect if not logged', (done) => {
    request
      .get('/')
      .end((err, res) => {
        expect(err).to.not.be.ok
        expect(res.statusCode).to.be.equal(302)
        expect(res.headers.location).to.be.equal('/login')
        done()
      })
  })

  it('should send a JSON response if not logged and using XHR', (done) => {
    request
      .get('/')
      .set('X-Requested-With', 'xmlhttprequest')
      .accept('application/json')
      .end((err, res) => {
        expect(err).to.not.be.ok
        expect(res.statusCode).to.be.equal(403)
        expect(res.body.error).to.be.equal('Forbidden')
        done()
      })
  })
})
