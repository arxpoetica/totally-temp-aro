app.service('MapLayer', function($http, $rootScope) {

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
		this.data = options.data;

		this.event_handlers = options.events || {};

		var data_layer = this.data_layer;
		var layer = this;

		data_layer.addListener('click', function(event) {
			layer.select_feature(event.feature);
		});

		data_layer.addListener('rightclick', function(event) {
			if (layer.event_handlers.rightclick) {
				layer.event_handlers.rightclick(event.feature);
			}
		})
	}

	MapLayer.prototype.select_feature = function(feature) {
		var layer = this;
		var data_layer = this.data_layer;
		$rootScope.infoWindow.setMap(null);

		if (feature.selected) {
			feature.selected = false;
			data_layer.overrideStyle(feature, layer.style_options.normal);
			if (layer.event_handlers.deselected) {
				layer.event_handlers.deselected(feature);
			}
		} else {
			feature.selected = true;
			if (layer.style_options.selected) {
				data_layer.overrideStyle(feature, layer.style_options.selected);
			}
			if (layer.event_handlers.selected) {
				layer.event_handlers.selected(feature);
			}
		}
	}

	// Load GeoJSON data into the layer if it's not already loaded
	MapLayer.prototype.load_data = function() {
		var layer = this;
		if (!layer.data_loaded) {
			if (layer.data) {
				this.data_layer.addGeoJson(layer.data);
				layer.data_loaded = true;
				return;
			}
			var promise = $http.get(this.api_endpoint).then(function(response) {
				var data = response.data;
				layer.data_layer.addGeoJson(data.feature_collection);
				layer.metadata = data.metadata;
				layer.data_loaded = true;
			});
		}
	}

	MapLayer.prototype.show = function() {
		$rootScope.infoWindow.setMap(null);
		this.load_data();
		this.data_layer.setMap(map);
		this.visible = true;
	}

	MapLayer.prototype.hide = function() {
		$rootScope.infoWindow.setMap(null);
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
