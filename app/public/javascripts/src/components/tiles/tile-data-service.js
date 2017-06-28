app.service('tileDataService', ['$http', ($http) => {

  // IMPORTANT: The vector-tile and pbf bundles must have been included before this point
  var VectorTile = require('vector-tile').VectorTile
  var Protobuf = require('pbf')

  var tileDataService = {}
  tileDataService.tileDataCache = {}

  tileDataService.getTileCacheKey = (zoom, x, y, layerId) => {
    return `${zoom}-${x}-${y}-${layerId}`
  }

  tileDataService.getTileData = (zoom, x, y, layerId) => {
    var tileCacheKey = tileDataService.getTileCacheKey(zoom, x, y, layerId)
    if (tileDataService.tileDataCache[tileCacheKey]) {
      // Tile data exists in cache
      console.log('Tile exists. Returning cached tile')
      return Promise.resolve(tileDataService.tileDataCache[tileCacheKey])
    } else {
      // Tile data does not exist in cache. Get it from a server
      var tileUrl = `/tile/${zoom}/${x}/${y}/${layerId}?aggregate=true`

      return new Promise((resolve, reject) => {

        // Getting binary data from the server. Directly use XMLHttpRequest()
        var oReq = new XMLHttpRequest();
        oReq.open("GET", tileUrl, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(oEvent) {
          var arrayBuffer = oReq.response;
          var tile = new VectorTile(new Protobuf(arrayBuffer))
          var positions = []

          Object.keys(tile.layers).forEach((layerKey) => {
            var layer = tile.layers[layerKey]
            for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
              var feature = layer.feature(iFeature)
              positions.push(feature.loadGeometry()[0][0])  // Super-hack! [0][0]
            }
          })
          tileDataService.tileDataCache[tileCacheKey] = positions

          resolve(positions)
        };
        oReq.onerror = function(error) { reject(error) }
        oReq.onabort = function() { reject('XMLHttpRequest abort') }
        oReq.ontimeout = function() { reject('XMLHttpRequest timeout') }
        oReq.send();
      })
    }
  }

  tileDataService.clearCache = () => {
    tileDataService.tileCache = {}
  }

  return tileDataService
}])
