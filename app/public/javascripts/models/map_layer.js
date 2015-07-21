app.service('MapLayer', function($http) {

	// one infowindow for all layers
	var infowindow = new google.maps.InfoWindow();

	function MapLayer(options) {
		this.short_name = options.short_name;
		this.api_endpoint = options.api_endpoint;
		this.style_options = options.style_options;
		this.data_layer = new google.maps.Data();
		this.data_layer.setStyle(this.style_options.normal);
		this.data_layer.setMap(map);
		this.metadata = {};
		this.data_loaded = false;
		this.visible = false;

		this.selection_endpoint = options.selection_endpoint;
		this.collection = options.collection;

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

		if (feature.selected) {
			feature.selected = false;
			data_layer.overrideStyle(feature, layer.style_options.normal);
			var id = feature.getProperty('id');
			$http.get(layer.selection_endpoint + id).success(function(response) { // TODO: remove this api call
				layer.collection.remove(feature.vertex_id, feature);
			});
		} else {
			feature.selected = true;
			if (layer.selection_endpoint) {
				var id = feature.getProperty('id');
				$http.get(layer.selection_endpoint + id).success(function(response) {
					feature.vertex_id = response.vertex_id;
					layer.collection.add(response.vertex_id, feature);
				});
			}
			if (layer.style_options.selected) {
				data_layer.overrideStyle(feature, layer.style_options.selected);
			}
		}
	}

	// Load GeoJSON data into the layer if it's not already loaded
	MapLayer.prototype.load_data = function() {
		var layer = this;
		if (!layer.data_loaded) {
			var promise = $http.get(this.api_endpoint).then(function(response) {
				var data = response.data;
				layer.data_layer.addGeoJson(data.feature_collection);
				layer.metadata = data.metadata;
				layer.data_loaded = true;
			});
		}
	}

	MapLayer.prototype.show = function() {
		this.load_data();
		this.data_layer.setMap(map);
		this.visible = true;
	}

	MapLayer.prototype.hide = function() {
		this.data_layer.setMap(null);
		this.visible = false;
	}

	MapLayer.prototype.toggle_visibility = function() {
		this.visible ? this.hide() : this.show();
	}

	MapLayer.prototype.clear_data = function() {
		var data = this.data_layer
		data.forEach(function(feature) {
			data.remove(feature);
		});
		this.metadata = {};
	}

	MapLayer.prototype.revert_styles = function() {
		this.data_layer.revertStyle();
		this.data_layer.forEach(function(feature) {
			delete feature.selected;
			delete feature.vertex_id;
		});
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

	MapLayer.prototype.remove = function() {
		this.data_layer.setMap(null);
	}

	return MapLayer;
});
