var expect = require('chai').expect;
var request = require('./test_utils').request;

describe('Wirecenter', function() {

  describe('#find_by_wirecenter_code()', function() {
    var wirecenter_code = 'NYCMNY79';

    it('should return the information of the wirecenter', function(done) {
      request
        .get('/wirecenters/'+wirecenter_code)
        .accept('application/json')
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
          expect(res.statusCode).to.be.equal(200);
          expect(output.feature_collection).to.be.an('object');
          expect(output.feature_collection.type).to.be.equal('FeatureCollection');
          expect(output.feature_collection.features).to.be.an('array');
          expect(output.feature_collection.features).to.have.length(1);
          expect(output.feature_collection.features[0].type).to.be.equal('Feature');
          expect(output.feature_collection.features[0].properties).to.be.an('object');
          expect(output.feature_collection.features[0].properties.id).to.be.equal(117);
          expect(output.feature_collection.features[0].properties.name).to.be.equal('NYCMNY79');
          expect(output.feature_collection.features[0].geometry).to.be.an('object');
          expect(output.feature_collection.features[0].geometry.type).to.be.equal('MultiPolygon');
          done();
        });
      
    });

  });

  describe('#find_all()', function() {
    it('should return the information of the wirecenter', function(done) {
      request
        .get('/wirecenters')
        .accept('application/json')
        .end(function(err, res) {
          if (err) return done(err);
          var output = res.body;
          expect(res.statusCode).to.be.equal(200);
          expect(output.feature_collection).to.be.an('object');
          expect(output.feature_collection.type).to.be.equal('FeatureCollection');
          expect(output.feature_collection.features).to.be.an('array');
          expect(output.feature_collection.features).to.have.length(814);
          expect(output.feature_collection.features[0].type).to.be.equal('Feature');
          expect(output.feature_collection.features[0].properties).to.be.an('object');
          expect(output.feature_collection.features[0].properties.id).to.be.a('number');
          expect(output.feature_collection.features[0].properties.name).to.be.a('string');
          expect(output.feature_collection.features[0].geometry).to.be.an('object');
          expect(output.feature_collection.features[0].geometry.type).to.be.equal('MultiPolygon');
          done();
        });
      
    });

  });

});
