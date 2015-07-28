var GeoJsonHelper = {};

// Builds a GeoJSON FeatureCollection with an array of features inside it.
//
// 1. data: node-pg result end callback (ex. query.on('end', function(data)))
// 2. properties: ex. {'color':'green', 'name': 'Some Name'}
GeoJsonHelper.build_feature_collection = function(data, properties) {
	var features = [];

		for (var i in data) {
			features[i] = {
				'type':'Feature',
				'properties': properties,
				'geometry': data[i].geom,
			}
		}

		var out = {
			'type':'FeatureCollection',
			'features': features
		};

	return out;
}

module.exports = GeoJsonHelper;