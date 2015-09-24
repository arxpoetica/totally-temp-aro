var expect = require('chai').expect;
var request = require('./test_utils').request;

describe('Map', function() {

  it('should return the map page', function(done) {
    request
      .get('/')
      .accept('text/html')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.be.equal(200);
        done();
      });
  });

});
