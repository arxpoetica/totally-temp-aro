/* global describe it*/
var expect = require('chai').expect
var GeoJsonHelper = require('../../helpers/geojson.js')

describe('GeoJsonHelper', () => {
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

  var properties = {'color': 'black', 'name': 'Brooklyn'}

  describe('#build_feature_collection()', () => {
    it('should build a GeoJSON FeatureCollection', () => {
      var output = GeoJsonHelper.featureCollection(data, properties)
      expect(output.feature_collection).to.be.an('object')
      expect(output.feature_collection.type).to.equal('FeatureCollection')
      expect(output.feature_collection.features).to.have.length(10)
      expect(output.feature_collection.features[0].properties).to.have.a.property('color', 'black')
      expect(output.feature_collection.features[0].properties).to.have.a.property('name', 'Brooklyn')
    })
  })
})
