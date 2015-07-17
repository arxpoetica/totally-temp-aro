app.service('MapLayer', function($http) {

	function MapLayer(api_endpoint, map, style_options) {
		this.api_endpoint = api_endpoint;
		this.map = map;
		this.data_layer = new google.maps.Data();
		this.metadata = {};
		this.style_options = style_options.normal;
		this.data_loaded = false;
		this.visible = false;

		var data_layer = this.data_layer;
		var layer = this;

		data_layer.addListener('click', function(event) {
			if (layer.selection_endpoint) {
				var id = event.feature.getProperty('id');
				$http.get(layer.selection_endpoint + id).success(function(response) {
					layer.collection.add(response.vertex_id);
				});
			}
			if (style_options.selected) {
				data_layer.overrideStyle(event.feature, style_options.selected)
			}
		});
	}

	MapLayer.prototype.set_selection_action = function(selection_endpoint, collection) {
		this.selection_endpoint = selection_endpoint;
		this.collection = collection;
	}

	// Load GeoJSON data into the layer if it's not already loaded
	MapLayer.prototype.load_data = function() {
		var promise = $http.get(this.api_endpoint).then(function(response) {
			return response.data;
		});

		return promise;
	};

	// Style the layer using options from a hash
	MapLayer.prototype.apply_style = function() {
		if (this.style_options.icon) {
			this.data_layer.setStyle({icon: this.style_options.icon});
		} else {
			this.data_layer.setStyle(this.style_options);
		}
	}

	MapLayer.prototype.toggle_visibility = function() {
		var layer = this
		if (!layer.visible) {
			if (!layer.data_loaded) {
				layer.load_data().then(function(data) {
					layer.data_layer.addGeoJson(data.feature_collection);
					layer.metadata = data.metadata;
					layer.data_loaded = true;
				});
			}
			layer.apply_style();
			layer.data_layer.setMap(map);
			layer.visible = true;
		} else {
			layer.data_layer.setMap(null);
			layer.visible = false;
		}
	}

	return MapLayer;
});