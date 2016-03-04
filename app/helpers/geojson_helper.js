'use strict'

module.exports = class GeoJsonHelper {

  // Builds a GeoJSON FeatureCollection with an array of features inside it.
  //
  // 1. data: node-pg result end callback (ex. query.on('end', function(data)))
  // 2. properties: ex. {'color':'green', 'name': 'Some Name'}
  static build_feature_collection (data, properties) {
    return {
      'type': 'FeatureCollection',
      'features': data.map((item) => ({
        'type': 'Feature',
        'properties': properties,
        'geometry': item.geom
      }))
    }
  }

}
