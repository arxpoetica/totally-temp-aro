var expect = require('chai').expect;
var models = require('../../models');

describe('Boundary', function() {

  var plan_id;
  var boundary_id;

  before(function(done) {
    var area = {
      "name": "Manhattan, New York, NY, USA",
      "centroid": {
        "lat": 40.7830603,
        "lng": -73.9712488
      },
      "bounds": {
        "northeast": {
          "lat": 40.882214,
          "lng": -73.907
        },
        "southwest": {
          "lat": 40.6803955,
          "lng": -74.047285
        }
      }
    };
    models.NetworkPlan.create_plan('Untitled route', area, function(err, plan) {
      expect(plan).to.have.property('id');
      expect(plan).to.have.property('name');
      plan_id = plan.id;
      done();
    });
  });

  it('should create a boundary', function(done) {
    var data = {
      name: 'Boundary name',
      geom: '{"type":"MultiPolygon","coordinates":[[[[-73.95953178405762,40.77779987546684],[-73.94948959350586,40.775265016944275],[-73.95790100097656,40.76947997759306],[-73.96373748779297,40.77201505683673]]]]}'
    };
    models.Boundary.create_boundary(plan_id, data, function(err, boundary) {
      expect(err).to.not.be.ok;
      expect(boundary.id).to.be.a('number');
      expect(boundary.name).to.be.a('string');
      expect(boundary.name).to.be.equal(data.name);
      expect(boundary.geom).to.be.an('object');
      expect(boundary.geom.type).to.be.equal('MultiPolygon');
      expect(boundary.geom.coordinates).to.be.an('array');
      boundary_id = boundary.id;
      done();
    });
  });

  it('should edit a boundary', function(done) {
    var data = {
      id: boundary_id,
      plan_id: plan_id,
      name: 'New boundary name',
      geom: '{"type":"MultiPolygon","coordinates":[[[[-73.95953178405762,40.77779987546684],[-73.94948959350586,40.775265016944275],[-73.95790100097656,40.76947997759306],[-73.96373748779297,40.77201505683673]]]]}'
    };
    models.Boundary.edit_boundary(data, function(err, n) {
      expect(err).to.not.be.ok;
      expect(n).to.be.equal(1);
      done();
    });
  });

  it('should not edit a boundary with an invalid plan_id', function(done) {
    var data = {
      id: boundary_id,
      plan_id: -1,
      name: 'New boundary name',
      geom: '{"type":"MultiPolygon","coordinates":[[[[-73.95953178405762,40.77779987546684],[-73.94948959350586,40.775265016944275],[-73.95790100097656,40.76947997759306],[-73.96373748779297,40.77201505683673]]]]}'
    };
    models.Boundary.edit_boundary(data, function(err, n) {
      expect(err).to.not.be.ok;
      expect(n).to.be.equal(0);
      done();
    });
  });

  it('should not edit a boundary with an invalid plan_id', function(done) {
    var data = {
      id: boundary_id,
      plan_id: -1,
      name: 'New boundary name',
      geom: '{"type":"MultiPolygon","coordinates":[[[[-73.95953178405762,40.77779987546684],[-73.94948959350586,40.775265016944275],[-73.95790100097656,40.76947997759306],[-73.96373748779297,40.77201505683673]]]]}'
    };
    models.Boundary.edit_boundary(data, function(err, n) {
      expect(err).to.not.be.ok;
      expect(n).to.be.equal(0);
      done();
    });
  });

  it('should list the existing boundaries', function(done) {
    models.Boundary.find_boundaries(plan_id, function(err, list) {
      expect(err).to.not.be.ok;
      expect(list).to.be.an('array');
      expect(list).to.have.length(1);
      var boundary = list[0];
      expect(boundary.id).to.be.equal(boundary_id);
      expect(boundary.name).to.be.a('string');
      expect(boundary.geom).to.be.an('object');
      expect(boundary.geom.type).to.be.equal('MultiPolygon');
      expect(boundary.geom.coordinates).to.be.an('array');
      done();
    });
  });

  it('should delete a boundary', function(done) {
    models.Boundary.delete_boundary(plan_id, boundary_id, function(err, n) {
      expect(err).to.not.be.ok;
      expect(n).to.be.equal(1);
      models.Boundary.find_boundaries(plan_id, function(err, list) {
        expect(err).to.not.be.ok;
        expect(list).to.have.length(0);
        done();
      });
    });
  });

});
