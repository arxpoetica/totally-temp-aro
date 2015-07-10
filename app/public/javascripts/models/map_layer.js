app.service('MapLayer', function() {

	function MapLayer(api_endpoint, style_options, map) {
		this.api_endpoint = api_endpoint;
		this.map = map;
		this.data_layer = new google.maps.Data();
		this.style_options = style_options;
		// Default settings
		this.data_loaded = false;
		this.visible = false;
	}

	// Load GeoJSON data into the layer if it's not already loaded
	MapLayer.prototype.load_data = function() {
		if (!this.data_loaded) {
			this.data_layer.loadGeoJson(this.api_endpoint);
			this.data_loaded = true;
		}
	};

	// Style the layer using options from a hash
	MapLayer.prototype.apply_style = function() {
		if (this.style_options.icon) {
			this.data_layer.setStyle({icon: this.style_options.icon});
		} else {
			this.data_layer.setStyle(this.style_options);
		}
	}

	return MapLayer;
});