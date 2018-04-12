app.service('tileDataService', ['$http', ($http) => {

  // IMPORTANT: The vector-tile and pbf bundles must have been included before this point
  var VectorTile = require('vector-tile').VectorTile
  var Protobuf = require('pbf')

  var tileDataService = {}
  tileDataService.tileDataCache = {}
  tileDataService.tileHtmlCache = {}  // A cache of HTML elements created. Used to prevent flicker.
  // Hold a map of layer keys to image urls (and image data once it is loaded)
  tileDataService.entityImageCache = {}
  tileDataService.featuresToExclude = new Set() // Locations with these location ids will not be rendered

  tileDataService.getTileCacheKey = (url) => {
    return url  // Perhaps this should be hashed and shortened? Urls are long
  }

  tileDataService.hasNeighbouringData = (mapLayers, zoom, tileX, tileY) => {
    var hasAllNeighbouringData = true
    for (var dx = -1; dx <= 1; ++dx) {
      for (var dy = -1; dy <= 1; ++dy) {
        var x = tileX + dx
        var y = tileY + dy
        Object.keys(mapLayers).forEach((mapLayerKey) => {
          var mapLayer = mapLayers[mapLayerKey]
          mapLayer.dataUrls.forEach((url) => {
            var urlKey = url + `${zoom}/${x}/${y}.mvt`
            var tileCacheKey = tileDataService.getTileCacheKey(urlKey)
            var hasData = tileDataService.tileDataCache.hasOwnProperty(tileCacheKey)
            hasAllNeighbouringData = hasAllNeighbouringData && hasData
          })
        })
      }
    }
    return hasAllNeighbouringData
  }

  tileDataService.getTileData = (mapLayer, zoom, tileX, tileY) => {
	//console.log(mapLayer) 
    if (!mapLayer.aggregateMode || mapLayer.aggregateMode === 'NONE' || mapLayer.aggregateMode === 'FLATTEN') {
      // We have one or multiple URLs where data is coming from, and we want a simple union of the results
      return tileDataService.getTileDataFlatten(mapLayer, zoom, tileX, tileY)
    } else if (mapLayer.aggregateMode === 'BY_ID') {
      // We want to aggregate by feature id
      return tileDataService.getTileDataAggregated(mapLayer, zoom, tileX, tileY)
    } else {
      throw `Unknown aggregate mode: ${mapLayer.aggregateMode}`
    }
  }

  var getTileDataSingleUrl = (url, zoom, tileX, tileY) => {
    url += `${zoom}/${tileX}/${tileY}.mvt`
    var tileCacheKey = tileDataService.getTileCacheKey(url)
    if (!tileDataService.tileDataCache.hasOwnProperty(tileCacheKey)) {
      // Tile data does not exist in cache. Get it from a server
      tileDataService.tileDataCache[tileCacheKey] = new Promise((resolve, reject) => {

        // Getting binary data from the server. Directly use XMLHttpRequest()
        var oReq = new XMLHttpRequest()
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(oEvent) {
          var arrayBuffer = oReq.response
          // De-serialize the binary data into a VectorTile object
          var mapboxVectorTile = new VectorTile(new Protobuf(arrayBuffer))
          // Save the features in a per-layer object
          var layerToFeatures = {}
          Object.keys(mapboxVectorTile.layers).forEach((layerKey) => {
        	    //console.log(layerKey)
            var layer = mapboxVectorTile.layers[layerKey]
            var features = []
            for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
            	  //console.log( layer.feature(iFeature) )
            	  let feature = layer.feature(iFeature)
            	  //ToDo: once we have feature IDs in place we can get rid of this check against a hardtyped URL
            	  if ('v1.tiles.census_block.select' == layerKey){
            		  //console.log(layer.feature(iFeature).)
            		  //layer.feature(iFeature) = formatCensusBlockData( layer.feature(iFeature) )
            		  formatCensusBlockData( feature )
            	  }
            	  
              features.push(feature)
            }
            layerToFeatures[layerKey] = features
          })
          tileDataService.tileDataCache[tileCacheKey] = {
            layerToFeatures: layerToFeatures
          }
          resolve(tileDataService.tileDataCache[tileCacheKey])
        }
        oReq.onerror = function(error) { reject(error) }
        oReq.onabort = function() { reject('XMLHttpRequest abort') }
        oReq.ontimeout = function() { reject('XMLHttpRequest timeout') }
        oReq.send()
      })
    }
    return tileDataService.tileDataCache[tileCacheKey]
  }
  
  var formatCensusBlockData = function(cBlock){
    cBlock.properties.layerType = 'census_block' // ToDo: once we have server-side 
    	let kvPairs = cBlock.properties.tags.split(';')
    	cBlock.properties.tags = {}
    	kvPairs.forEach((pair) => {
    	  let kv = pair.split(':')
    	  if ("" != kv[0]) cBlock.properties.tags[ kv[0]+"" ] = kv[1]
    	}) 
    //console.log(cBlock.properties.tags)
    //return cBlock 
  }
  
  // Flattens all URLs and returns tile data that is a simple union of all features
  tileDataService.getTileDataFlatten = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from, and we want a simple union of the results
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.dataUrls.forEach((tileUrl) => promises.push(getTileDataSingleUrl(tileUrl, zoom, tileX, tileY)))
      var hasIcon = mapLayer.iconUrl
      if (hasIcon) {
        promises.push(new Promise((resolve, reject) => {
          var img = new Image()
          img.src = mapLayer.iconUrl
          img.onload = () => {
            // Image has been loaded
            resolve(img)
          }
        }))
      }
      Promise.all(promises)
        .then((results) => {
          var allFeatures = []
          var numDataResults = hasIcon ? results.length - 1 : results.length
          for (var iResult = 0; iResult < numDataResults; ++iResult) {
            var result = results[iResult]
            var layerToFeatures = result.layerToFeatures
            Object.keys(layerToFeatures).forEach((layerKey) => {
              allFeatures = allFeatures.concat(layerToFeatures[layerKey])
            })
          }
          var tileData = {
            layerToFeatures: {
              FEATURES_FLATTENED: allFeatures
            }
          }
          if (hasIcon) {
            tileData.icon = results[results.length - 1]
          }
          resolve(tileData)
        })
    })
  }

  // Returns aggregated results for a tile
  tileDataService.getTileDataAggregated = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from. Return the aggregated result
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.dataUrls.forEach((tileUrl) => promises.push(getTileDataSingleUrl(tileUrl, zoom, tileX, tileY)))
      Promise.all(promises)
        .then((results) => {
          // We have data from all urls. First, we create an object that will map the objects
          // of interest (e.g. census blocks) to their geometry and list of properties.
          // For e.g. if we are aggregating download speeds for census blocks, we will have
          // Input: mapLayer.aggregateById = 'gid', mapLayer.aggregateProperty = 'download_speed'
          // Output:
          // {
          //   census_block_id_1: {
          //     geometry: { geom object },
          //     layers: [download_speed_1, download_speed2, ...]
          //   },
          //   census_block_id_2: { ... } ... etc
          // }
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
                var aggregateEntityGID = feature.properties[mapLayer.aggregateById]
                if (!entityData[aggregateEntityGID]) {
                  entityData[aggregateEntityGID] = {}
                }
                entityData[aggregateEntityGID].geometry = feature.loadGeometry()
                // Store the value to be aggregated (e.g. download_speed) in this layer
                if (!entityData[aggregateEntityGID].layers) {
                  entityData[aggregateEntityGID].layers =[]
                }
                entityData[aggregateEntityGID].layers.push(feature.properties[mapLayer.aggregateProperty])
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
            properties[mapLayer.aggregateProperty] = aggregateFinalValue
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
    if (tileDataService.entityImageCache[layerKey]) {
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
    tileDataService.entityImageCache[layerKey] = imageLoadedPromise
  }

  // Returns a promise for the image associated with a layer key
  tileDataService.getEntityImageForLayer = (layerKey) => {
    var entityImagePromise = tileDataService.entityImageCache[layerKey]
    if (!entityImagePromise) {
      throw 'No promise for image with layerKey ' + layerKey
    }
    return entityImagePromise
  }

  // Add a specified location ID to the set of features to be excluded from the render
  tileDataService.addFeatureToExclude = (featureId) => {
    tileDataService.featuresToExclude.add(featureId)
  }

  // Clear the entire tile data cache
  tileDataService.clearDataCache = () => {
    tileDataService.tileDataCache = {}
    tileDataService.featuresToExclude = new Set()
  }

  // Clear only those entries in the tile data cache containing the specified keywords
  tileDataService.clearDataCacheContaining = (keywords) => {
    Object.keys(tileDataService.tileDataCache).forEach((cacheKey) => {
      var shouldDelete = false
      keywords.forEach((keyword) => shouldDelete = shouldDelete || (cacheKey.indexOf(keyword) >= 0))
      if (shouldDelete) {
        delete tileDataService.tileDataCache[cacheKey]
      }
    })
  }

  // Mark all tiles in the HTML cache as dirty
  tileDataService.markHtmlCacheDirty = () => {
    Object.keys(tileDataService.tileHtmlCache).forEach((cacheId) => {
      tileDataService.tileHtmlCache[cacheId].isDirty = true
    })
  }

  // Completely erase the entire cache of HTML elements associated with tiles
  tileDataService.deleteHtmlCache = () => {
    tileDataService.tileHtmlCache = {}
  }

  return tileDataService
}])
