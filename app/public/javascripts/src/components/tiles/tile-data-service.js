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

  tileDataService.getTileData = (mapLayer, zoom, tileX, tileY) => {
    if (!mapLayer.aggregateMode || mapLayer.aggregateMode === 'NONE') {
      // No need to aggregate anything.
      return tileDataService.getTileDataSingleUrl(mapLayer.dataUrls[0], zoom, tileX, tileY)
    } else if (mapLayer.aggregateMode === 'FLATTEN') {
      // We have multiple URLs where data is coming from, and we want a simple union of the results
      return tileDataService.getTileDataFlatten(mapLayer, zoom, tileX, tileY)
    } else if (mapLayer.aggregateMode === 'BY_ID') {
      // We want to aggregate by feature id
      return tileDataService.getTileDataAggregated(mapLayer, zoom, tileX, tileY)
    } else {
      throw `Unknown aggregate mode: ${mapLayer.aggregateMode}`
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

  // Flattens all URLs and returns tile data that is a simple union of all features
  tileDataService.getTileDataFlatten = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from, and we want a simple union of the results
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.dataUrls.forEach((tileUrl) => promises.push(tileDataService.getTileDataSingleUrl(tileUrl, zoom, tileX, tileY)))
      Promise.all(promises)
        .then((results) => {
          var allFeatures = []
          results.forEach((result) => {
            var layerToFeatures = result.layerToFeatures
            Object.keys(layerToFeatures).forEach((layerKey) => {
              allFeatures = allFeatures.concat(layerToFeatures[layerKey])
            })
          })
          resolve({
            layerToFeatures: {
              FEATURES_FLATTENED: allFeatures
            }
          })
        })
    })
  }

  // Returns aggregated results for a tile
  tileDataService.getTileDataAggregated = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from. Return the aggregated result
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.dataUrls.forEach((tileUrl) => promises.push(tileDataService.getTileDataSingleUrl(tileUrl, zoom, tileX, tileY)))
      Promise.all(promises)
        .then((results) => {
          // We have data from all urls. First, we create an object that will map the objects
          // of interest (e.g. census blocks) to their geometry and list of properties.
          // For e.g. if we are aggregating download speeds for census blocks, we will have
          // {
          //   census_block_id_1: {
          //     geometry: { geom object },
          //     layers: [download_speed_1, download_speed2, ...]
          //   },
          //   census_block_id_2: { ... } ... etc
          // }
          var aggregateEntityId = aggregateOptions.aggregateEntityId
          var aggregateBy = aggregateOptions.aggregateBy
          var entityData = {}
          // Loop through each tile result
          results.forEach((result) => {
            var layerToFeatures = result.layerToFeatures
            // Each tile can have multiple layers per the MVT specification. Loop through them
            Object.keys(layerToFeatures).forEach((layerKey) => {
              // Loop through all the features in this layer
              var features = layerToFeatures[layerKey]
              features.forEach((feature) => {
                // Store the geometry for the census block. This will be overwritten but should be fine since its the same geometry
                var aggregateEntityGID = feature.properties[aggregateEntityId]
                if (!entityData[aggregateEntityGID]) {
                  entityData[aggregateEntityGID] = {}
                }
                entityData[aggregateEntityGID].geometry = feature.loadGeometry()
                // Store the value to be aggregated (e.g. download_speed) in this layer
                if (!entityData[aggregateEntityGID].layers) {
                  entityData[aggregateEntityGID].layers =[]
                }
                entityData[aggregateEntityGID].layers.push(feature.properties[aggregateBy])
              })
            })
          })

          // Now that we have everything per-aggregation-entity, find the aggregates and create the output geometries
          var aggregateFeatures = []
          Object.keys(entityData).forEach((aggregateEntityGID) => {
            // Find the sum of the values to be aggregated across all layers
            var sumValues = 0
            entityData[aggregateEntityGID].layers.forEach((layer) => sumValues += layer)
            // Find the speed intensity for this census block
            const MY_SPEED = 7
            const aggregateFinalValue = 1 - (MY_SPEED / (MY_SPEED + sumValues))
            // Save it all out in a feature
            var properties = {}
            properties[aggregateBy] = aggregateFinalValue
            aggregateFeatures.push({
              properties: properties,
              loadGeometry: () => entityData[aggregateEntityGID].geometry // Hack because thats how we get the geometry later
            })
          })

          // Save it all out and return
          resolve({
            layerToFeatures: {
              AGGREGATE_LAYER: aggregateFeatures
            }
          })
        })
    })
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
    tileDataService.tileDataCache = {}
  }

  return tileDataService
}])
