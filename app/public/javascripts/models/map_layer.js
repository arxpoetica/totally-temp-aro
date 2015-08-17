app.service('MapLayer', function($http, $rootScope, selection) {

	function MapLayer(options) {
		this.name = options.name;
		this.short_name = options.short_name;
		this.api_endpoint = options.api_endpoint;
		this.style_options = options.style_options;
		this.data_layer = new google.maps.Data();
		this.data_layer.setMap(map);
		this.metadata = {};
		this.data_loaded = false;
		this.visible = false;
		this.data = options.data;
		this.type = options.type;
		this.always_show_selected = false;
		this.set_style('normal')

		var collection;
		if (this.type === 'locations') {
			collection = selection.targets;
		} else if (this.type === 'network_nodes') {
			collection = selection.sources;
		}
		this.collection = collection;

		var data_layer = this.data_layer;
		var layer = this;

		var feature_dragged;

		data_layer.addListener('click', function(event) {
			$rootScope.$broadcast('map_layer_clicked_feature', event, layer);
			if (!selection.is_enabled() || !event.feature.getProperty('id') || event.feature.getProperty('unselectable')) return;
			var changes = create_empty_changes(layer);
			layer.toggle_feature(event.feature, changes);
			broadcast_changes(layer, changes);
		});

		data_layer.addListener('mouseup', function(event) {
			if (feature_dragged) {
				$rootScope.$broadcast('map_layer_dragged_feature', event, feature_dragged);
			}
		});

		data_layer.addListener('mousedown', function(event) {
			feature_dragged = null;
		});

		data_layer.addListener('setgeometry', function(event) {
			feature_dragged = event.feature;
		});

		data_layer.addListener('mouseup', function(event) {
			$rootScope.$broadcast('map_layer_mouseup_feature', event, layer);
		});

		data_layer.addListener('mouseover', function(event) {
			if (layer.highlighteable && event.feature) {
				layer.data_layer.overrideStyle(event.feature, layer.style_options.highlight);
			}
			$rootScope.$broadcast('map_layer_mouseover_feature', event, layer);
		});

		data_layer.addListener('mouseout', function(event) {
			if (layer.highlighteable && event.feature) {
				layer.data_layer.overrideStyle(event.feature, layer.style_options.normal);
			}
		});

		data_layer.addListener('rightclick', function(event) {
			$rootScope.$broadcast('map_layer_rightclicked_feature', event, layer);
		});

		if (options.heatmap) {
			layer.heatmap_layer = new google.maps.visualization.HeatmapLayer();
			layer.heatmap_layer.set('radius', 30);
			$rootScope.$on('map_zoom_changed', function() {
				layer.configure_visibility();
			});
		}
	}

	MapLayer.prototype.set_highlighteable = function(highlighteable) {
		if (!highlighteable) {
			this.data_layer.revertStyle();
		}
		this.highlighteable = highlighteable;
	};

	function create_empty_changes(layer) {
		var type = layer.type
		var changes = { insertions: {}, deletions: {} };
		changes.insertions[type] = [];
		changes.deletions[type] = [];
		return changes;
	}

	function broadcast_changes(layer, changes) {
		$rootScope.$broadcast('map_layer_changed_selection', layer, changes);
	}

	MapLayer.prototype.set_always_show_selected = function(show) {
		this.always_show_selected = show;
		this.configure_visibility();
		this.load_data();
	};

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

	MapLayer.prototype.set_feature_selected = function(feature, selected, changes) {
		if (feature.selected === selected) return;

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
		// This is needed because if the event is triggered from a google maps event
		// then we need angular to do its stuff. Otherwise couters for sources and targets
		// won't be updated. And if angular is already doing its stuff we cannot call $rootScope.$apply()
		// directly because it will throw an error
		if (!$rootScope.$$phase) { $rootScope.$apply(); }
	};

	MapLayer.prototype.toggle_feature = function(feature, changes) {
		this.set_feature_selected(feature, !feature.selected, changes);
	};

	MapLayer.prototype.select_random_features = function() {
		var self = this;
		var i = 0;
		var changes = create_empty_changes(self);
		self.data_layer.forEach(function(feature) {
			if (i < 3 && !feature.selected) {
				self.toggle_feature(feature, changes);
				i++;
			}
		});
		broadcast_changes(self, changes);
	};

	MapLayer.prototype.select_random_area = function() {
		var feature;
		this.data_layer.forEach(function(f) {
			if (f.getProperty('id') === 216835) feature = f;
		});
		var event = {
			feature: feature,
		}
		$rootScope.$broadcast('map_layer_clicked_feature', event, this);
	}

	// Load GeoJSON data into the layer if it's not already loaded
	MapLayer.prototype.load_data = function(val) {
		var layer = this;
		if (val) {
			if (typeof val === 'string') {
				layer.api_endpoint = val;
			} else {
				layer.data = val;
			}
			layer.clear_data();
		}
		if (!layer.data_loaded) {
			if (layer.data) {
				this.data_layer.addGeoJson(layer.data);
				load_heatmap_layer();
				layer.data_loaded = true;
				$rootScope.$broadcast('map_layer_loaded_data', layer);
				this.configure_feature_styles();
			} else if (this.api_endpoint) {
				$http.get(this.api_endpoint).success(function(response) {
					var data = response;
					layer.data_layer.addGeoJson(data.feature_collection);
					load_heatmap_layer();
					layer.metadata = data.metadata;
					layer.data_loaded = true;
					$rootScope.$broadcast('map_layer_loaded_data', layer);

					layer.configure_feature_styles();
					layer.sync_selection();
				});
			}
		}

		function load_heatmap_layer() {
			if (!layer.heatmap_layer) return;
			var arr = [];
			layer.data_layer.forEach(function(feature) {
				arr.push(feature.getGeometry().get());
			});
			layer.heatmap_layer.setData(new google.maps.MVCArray(arr));
		}
	}

	MapLayer.prototype.set_api_endpoint = function(api_endpoint) {
		if (this.api_endpoint === api_endpoint) return;
		this.api_endpoint = api_endpoint;
		this.data_loaded = false;
		this.clear_data();
		if (this.visible) {
			this.load_data();
		}
	};

	MapLayer.prototype.reload_data = function() {
		this.clear_data();
		this.load_data();
	};

	MapLayer.prototype.configure_feature_styles = function() {
		var data = this.data_layer;
		data.forEach(function(feature) {
			var styles = {};
			var icon = feature.getProperty('icon');
			if (icon) {
				styles.icon = icon;
			}
			var draggable = feature.getProperty('draggable');
			styles.draggable = draggable;
			if (_.size(styles) > 0) {
				data.overrideStyle(feature, styles);
			}
		});
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
		this.visible = true;
		this.configure_visibility();
		$rootScope.$broadcast('map_layer_changed_visibility', this);
	}

	MapLayer.prototype.hide = function() {
		this.visible = false;
		this.configure_visibility();
		$rootScope.$broadcast('map_layer_changed_visibility', this);
	}

	MapLayer.prototype.set_style = function(type) {
		if (this.current_style === type) return; // this avoids repainting things when no needed
		this.current_style = type;

		if (type === 'normal') {
			this.data_layer.setStyle(this.style_options.normal);
			this.configure_feature_styles();
		} else if (type === 'highlight') {
			this.data_layer.setStyle(this.style_options.highlight);
		} else if (type === 'hidden') {
			this.data_layer.setStyle({
				visible: false,
			});
		}
	};

	MapLayer.prototype.configure_visibility = function() {
		if (this.visible) {
			if (this.heatmap_layer) {
				if (map.getZoom() > 16) {
					this.heatmap_layer.setMap(null);
					this.data_layer.setMap(map);
					this.set_style('normal');
				} else {
					this.heatmap_layer.setMap(map);
					this.data_layer.setMap(this.always_show_selected ? map : null);
					this.set_style('hidden');
				}
			} else {
				this.data_layer.setMap(map);
				this.set_style('normal');
			}
		} else {
			if (this.always_show_selected) {
				this.set_style('hidden');
				this.data_layer.setMap(map);
			} else {
				this.set_style('normal');
				this.data_layer.setMap(null);
			}
			if (this.heatmap_layer) {
				this.heatmap_layer.setMap(null);
			}
		}
	}

	MapLayer.prototype.toggle_visibility = function() {
		this.visible ? this.hide() : this.show();
	}

	MapLayer.prototype.clear_data = function() {
		var data = this.data_layer;
		data.forEach(function(feature) {
			data.remove(feature);
		});
		this.data_loaded = false;
		this.metadata = {};
	}

	MapLayer.prototype.revert_styles = function() {
		var data = this.data_layer;
		data.revertStyle();
		data.forEach(function(feature) {
			delete feature.selected;
			var icon = feature.getProperty('icon');
			if (icon) {
				data.overrideStyle(feature, { icon: icon });
			}
		});
	}

	MapLayer.prototype.change_selection_for_features_matching = function(select, func) {
		var layer = this;
		if (!layer.visible) return;
		var data = this.data_layer;
		var changes = create_empty_changes(layer);

		data.forEach(function(feature) {
			if (func(feature)) {
				layer.set_feature_selected(feature, select, changes);
			}
		});
		broadcast_changes(layer, changes);
	}

	MapLayer.prototype.remove = function() {
		this.data_layer.setMap(null);
	}

	MapLayer.prototype.number_of_features = function() {
		var i = 0;
		this.data_layer.forEach(function(feature) { i++; });
		return i;
	}

	return MapLayer;
});
