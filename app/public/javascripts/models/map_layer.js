app.service('MapLayer', function($http) {

	// one infowindow for all layers
	var infowindow = new google.maps.InfoWindow();

	function MapLayer(api_endpoint, style_options) {
		this.api_endpoint = api_endpoint;
		this.map = map;
		this.data_layer = new google.maps.Data();
		this.metadata = {};
		this.style_options = style_options;
		this.data_loaded = false;
		this.visible = false;

		var data_layer = this.data_layer;
		var layer = this;

		data_layer.addListener('click', function(event) {
			/*
			var position = event.feature.getGeometry().get();
			infowindow.setContent("<p>Hello!!</p>");
			infowindow.setPosition(position);
			infowindow.setZIndex(1000);
			infowindow.open(map);
			*/

			layer.select_feature(event.feature);
		});
	}

	MapLayer.prototype.select_feature = function(feature) {
		var layer = this;
		var data_layer = this.data_layer;

		if (layer.selection_endpoint) {
			var id = feature.getProperty('id');
			$http.get(layer.selection_endpoint + id).success(function(response) {
				layer.collection.add(response.vertex_id);
			});
		}
		console.log('overrideStyle', layer.style_options)
		if (layer.style_options.selected) {
			data_layer.overrideStyle(feature, layer.style_options.selected);
		}
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
		if (this.style_options) {
			this.data_layer.setStyle(this.style_options.normal);
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

	MapLayer.prototype.clear_data = function() {
		var data = this.data_layer
		data.forEach(function(feature) {
			data.remove(feature);
		});
	}

	MapLayer.prototype.revert_styles = function() {
		this.data_layer.revertStyle();
	}

	MapLayer.prototype.select_in_bounds = function(bounds) {
		var layer = this;
		if (!layer.visible) return;
		var data = this.data_layer
		data.forEach(function(feature) {
			if (bounds.contains(feature.getGeometry().get())) {
				layer.select_feature(feature);
			}
		});
	}

	return MapLayer;
});
