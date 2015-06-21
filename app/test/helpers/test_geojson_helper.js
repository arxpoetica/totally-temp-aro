var expect = require('chai').expect;
var pg = require('pg');
var CountySubdivision = ('../../models/county_subdivision.js');
var GeoJsonHelper = require('../../helpers/geojson_helper.js');

describe('GeoJsonHelper', function() {

	// 10 features
	var data = [ { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Harrietstown' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Pharsalia' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Bangor' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Bombay' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Pitcher' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Brighton' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Burke' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Oxford' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Preston' },
  { geom: { type: 'MultiPolygon', coordinates: [Object] },
    name: 'Sherburne' }
  ]

  var properties = {'color':'black', 'name':'Brooklyn'};

	describe('#build_feature_collection()', function() {

		it('should build a GeoJSON FeatureCollection', function() {
			var output = GeoJsonHelper.build_feature_collection(data, properties);
			expect(output.type).to.equal('FeatureCollection');
		});

		it('should build an array of Features', function() {
			var output = GeoJsonHelper.build_feature_collection(data, properties);
			expect(output.features).to.have.length(10);
		});

		it('should include specified properties in the GeoJSON', function() {
			var output = GeoJsonHelper.build_feature_collection(data, properties);
			expect(output.features[0].properties).to.have.a.property('color', 'black');
			expect(output.features[0].properties).to.have.a.property('name', 'Brooklyn');
		});

	});

});