var _ = require('underscore')

module.exports = class GeoJsonHelper {

  // Builds a GeoJSON FeatureCollection with an array of features inside it.
  //
  // 1. rows: a query result
  // 2. properties: ex. {'color':'green', 'name': 'Some Name'}
  static featureCollection (rows, properties) {
    return {
      'feature_collection': {
        'type': 'FeatureCollection',
        'features': rows.map((row) => ({
          type: 'Feature',
          geometry: row.geom,
          properties: _.extend(_.omit(row, 'geom'), properties)
        }))
      }
    }
  }

}
