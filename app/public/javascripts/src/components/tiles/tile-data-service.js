app.service('tileDataService', ['$http', ($http) => {

  // IMPORTANT: The vector-tile and pbf bundles must have been included before this point
  var VectorTile = require('vector-tile').VectorTile
  var Protobuf = require('pbf')

  var tileDataService = {}
  tileDataService.tileDataCache = {}

  tileDataService.getTileCacheKey = (url) => {
    return url  // Perhaps this should be hashed and shortened? Urls are long
  }

  tileDataService.getTileData = (url) => {
    var tileCacheKey = tileDataService.getTileCacheKey(url)
    if (tileDataService.tileDataCache[tileCacheKey]) {
      // Tile data exists in cache
      return Promise.resolve(tileDataService.tileDataCache[tileCacheKey])
    } else {
      // Tile data does not exist in cache. Get it from a server
      return new Promise((resolve, reject) => {

        // Getting binary data from the server. Directly use XMLHttpRequest()
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(oEvent) {
          var arrayBuffer = oReq.response
          // De-serialize the binary data into a VectorTile object
          var mapboxVectorTile = new VectorTile(new Protobuf(arrayBuffer))
          tileDataService.tileDataCache[tileCacheKey] = mapboxVectorTile
          resolve(mapboxVectorTile)
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
