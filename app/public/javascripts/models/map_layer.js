app.service('MapLayer', function($http, $rootScope, selection) {

	function MapLayer(options) {
		this.name = options.name;
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
		this.type = options.type;

		if (this.type === 'locations') {
			collection = selection.targets;
		} else if (this.type === 'splice_points') {
			collection = selection.sources;
		}
		this.collection = collection;

		var data_layer = this.data_layer;
		var layer = this;

		data_layer.addListener('click', function(event) {
			var changes = create_empty_changes(layer);
			layer.toggle_feature(event.feature, changes);
			broadcast_changes(layer, changes);
		});

		data_layer.addListener('rightclick', function(event) {
			$rootScope.$broadcast('map_layer_rightclicked_feature', event, layer);
		})
	}

	function create_empty_changes(layer) {
		var type = layer.type
		var changes = { insertions: {}, deletions: {} };
		changes.insertions[type] = [];
		changes.deletions[type] = [];
		return changes;
	}

	function broadcast_changes(layer, changes) {
		$rootScope.$broadcast('map_Layer_changed_selection', layer, changes);
	}

	MapLayer.prototype.select_feature = function(feature) {
		feature.selected = true;
		if (this.style_options.selected) {
			this.data_layer.overrideStyle(feature, this.style_options.selected);
		}
	};

	MapLayer.prototype.deselect_feature = function(feature) {
		feature.selected = false;
		if (this.style_options.selected) {
			this.data_layer.overrideStyle(feature, this.style_options.normal);
		}
	};

	MapLayer.prototype.toggle_feature = function(feature, changes) {
		var data_layer = this.data_layer;
		var id = feature.getProperty('id');

		if (feature.selected) {
			this.deselect_feature(feature);
			if (this.collection) {
				this.collection.remove(id);
			}
			changes.deletions[this.type].push(id);
		} else {
			this.select_feature(feature);
			if (this.collection) {
				this.collection.add(id);
			}
			changes.insertions[this.type].push(id);
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

				layer.sync_selection();
			});
		}
	}

	MapLayer.prototype.sync_selection = function() {
		var layer = this;
		var collection = this.collection;

		if (collection) {
			layer.data_layer.forEach(function(feature) {
				var id = feature.getProperty('id');
				if (collection.contains(id)) {
					layer.select_feature(feature);
				}
			});
		}
	}

	MapLayer.prototype.show = function() {
		this.load_data();
		this.data_layer.setMap(map);
		this.visible = true;
		$rootScope.$broadcast('map_Layer_changed_visibility', this);
	}

	MapLayer.prototype.hide = function() {
		this.data_layer.setMap(null);
		this.visible = false;
		$rootScope.$broadcast('map_Layer_changed_visibility', this);
	}

	MapLayer.prototype.toggle_visibility = function() {
		this.visible ? this.hide() : this.show();
	}

	MapLayer.prototype.clear_data = function() {
		var data = this.data_layer;
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

	MapLayer.prototype.toggle_features_in_bounds = function(bounds) {
		var layer = this;
		if (!layer.visible) return;
		var data = this.data_layer;
		var changes = create_empty_changes(layer);

		data.forEach(function(feature) {
			if (bounds.contains(feature.getGeometry().get())) {
				layer.toggle_feature(feature, changes);
			}
		});
		broadcast_changes(layer, changes);
	}

	MapLayer.prototype.remove = function() {
		this.data_layer.setMap(null);
	}

	return MapLayer;
});
