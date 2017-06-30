app.service('tileDataService', ['$http', ($http) => {

  // IMPORTANT: The vector-tile and pbf bundles must have been included before this point
  var VectorTile = require('vector-tile').VectorTile
  var Protobuf = require('pbf')

  var tileDataService = {}
  tileDataService.tileDataCache = {}
  // Hold a map of layer keys to image urls (and image data once it is loaded)
  tileDataService.layerEntityImages = {}

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

  // Adds a layer key and url to the tile data service
  tileDataService.addEntityImageForLayer = (layerKey, imageUrl) => {
    if (tileDataService.layerEntityImages[layerKey]) {
      // This has already been added. Nothing to do.
      return
    }
    // Start loading the data from the server
    var imageLoadedPromise = new Promise((resolve, reject) => {
      var img = new Image()
      img.src = imageUrl
      img.onload = () => {
        // Image has been loaded
        resolve(img)
      }
    })

    // Save the mapping
    tileDataService.layerEntityImages[layerKey] = imageLoadedPromise
  }

  // Returns a promise for the image associated with a layer key
  tileDataService.getEntityImageForLayer = (layerKey) => {
    var entityImagePromise = tileDataService.layerEntityImages[layerKey]
    if (!entityImagePromise) {
      throw 'No promise for image with layerKey ' + layerKey
    }
    return entityImagePromise
  }

  tileDataService.clearCache = () => {
    tileDataService.tileCache = {}
  }

  return tileDataService
}])
