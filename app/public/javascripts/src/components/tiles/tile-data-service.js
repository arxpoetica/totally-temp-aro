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

  tileDataService.getTileData = (tileUrls, zoom, tileX, tileY) => {
    if (tileUrls.length === 1) {
      // We have a single URL. No need to aggregate anything.
      return tileDataService.getTileDataSingleUrl(tileUrls[0], zoom, tileX, tileY)
    } else {
      // We have multiple URLs where data is coming from. Return the aggregated result
      return new Promise((resolve, reject) => {
        var promises = []
        tileUrls.forEach((tileUrl) => promises.push(tileDataService.getTileDataSingleUrl(tileUrl, zoom, tileX, tileY)))
        Promise.all(promises)
          .then((results) => {
            // We have data from all urls. Perform the aggregation that we want

            // First aggregate
            // Census Block
            // -- Geometry
            // -- layers[]
            //    1
            //      -- speed_intensity
            //    2
            //      -- speed intensity

            // First, hold a map of properties and geometry per census block
            var censusBlockData = {}
            results.forEach((result) => {
              var tileUrl = result.tileUrl
              var layerToFeatures = result.layerToFeatures
              Object.keys(layerToFeatures).forEach((layerKey) => {
                var features = layerToFeatures[layerKey]
                features.forEach((feature) => {
                  // Store the geometry for the census block. This will be overwritten but should be fine since its the same geometry
                  var censusBlockGID = feature.properties.census_block_gid
                  if (!censusBlockData[censusBlockGID]) {
                    censusBlockData[censusBlockGID] = {}
                  }
                  censusBlockData[censusBlockGID].geometry = feature.loadGeometry()
                  // Store the speed intensity in this layer
                  if (!censusBlockData[censusBlockGID].layers) {
                    censusBlockData[censusBlockGID].layers =[]
                  }
                  censusBlockData[censusBlockGID].layers.push({
                    download_speed: feature.properties.download_speed
                  })
                })
              })
            })

            // Now that we have everything per-census-block, find the aggregates and create the output geometries
            var cbFeatures = []
            Object.keys(censusBlockData).forEach((censusBlockGID) => {
              // Find the sum of speed intensities across all layers
              var sumSpeedIntensity = 0
              censusBlockData[censusBlockGID].layers.forEach((layer) => sumSpeedIntensity += layer.download_speed)
              // Find the speed intensity for this census block
              const MY_SPEED = 7
              const speedIntensity = 1 - (MY_SPEED / (MY_SPEED + sumSpeedIntensity))
              // Save it all out in a feature
              cbFeatures.push({
                properties: {
                  speed_intensity: speedIntensity
                },
                loadGeometry: () => censusBlockData[censusBlockGID].geometry
              })
            })

            // Save it all out and return
            resolve({
              tileUrl: 'AGGREGATE',
              layerToFeatures: {
                AGGREGATE_LAYER: cbFeatures
              }
            })
          })
      })
    }
  }

  tileDataService.getTileDataSingleUrl = (url, zoom, tileX, tileY) => {
    url += `${zoom}/${tileX}/${tileY}.mvt`
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
          // Save the features in a per-layer object
          var layerToFeatures = {}
          Object.keys(mapboxVectorTile.layers).forEach((layerKey) => {
            var layer = mapboxVectorTile.layers[layerKey]
            var features = []
            for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
              features.push(layer.feature(iFeature))
            }
            layerToFeatures[layerKey] = features
          })
          tileDataService.tileDataCache[tileCacheKey] = {
            tileUrl: url,
            layerToFeatures: layerToFeatures
          }
          resolve(tileDataService.tileDataCache[tileCacheKey])
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
