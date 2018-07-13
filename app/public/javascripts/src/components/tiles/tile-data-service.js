app.service('tileDataService', ['$rootScope', 'configuration', 'uiNotificationService', ($rootScope, configuration, uiNotificationService) => {

  // IMPORTANT: The vector-tile and pbf bundles must have been included before this point
  var VectorTile = require('vector-tile').VectorTile
  var Protobuf = require('pbf')

  var tileDataService = {}
  tileDataService.tileDataCache = {}
  tileDataService.tileProviderCache = {}
  tileDataService.tileHtmlCache = {}  // A cache of HTML elements created. Used to prevent flicker.
  // Hold a map of layer keys to image urls (and image data once it is loaded)
  tileDataService.entityImageCache = {}
  tileDataService.featuresToExclude = new Set() // Locations with these location ids will not be rendered
  tileDataService.modifiedFeatures = {} // A set of features (keyed by objectId) that are modified from their original position

  tileDataService.LOCK_ICON_KEY = 'LOCK_ICON'
  if (configuration.locationCategories && configuration.locationCategories.entityLockIcon) {
    tileDataService.addEntityImageForLayer(tileDataService.LOCK_ICON_KEY, configuration.locationCategories.entityLockIcon)
  }
  // If we get a 'configuration_loaded' event then we should definitely have the entityLockIcon
  $rootScope.$on('configuration_loaded', () => tileDataService.addEntityImageForLayer(tileDataService.LOCK_ICON_KEY, configuration.locationCategories.entityLockIcon))

  tileDataService.getTileData = (mapLayer, zoom, tileX, tileY) => {
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

  // Sets the current list of map layers
  tileDataService.mapLayers = {}
  tileDataService.setMapLayers = (mapLayers) => {
    tileDataService.mapLayers = mapLayers
  }

  tileDataService.getMapData = (layerDefinitions, zoom, tileX, tileY) => {
    return new Promise((resolve, reject) => {
      // Getting binary data from the server. Directly use XMLHttpRequest()
      var oReq = new XMLHttpRequest()
      oReq.open('POST', `/tile/v1/tiles/layers/${zoom}/${tileX}/${tileY}.mvt`, true)
      oReq.setRequestHeader('Content-Type', 'application/json')
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
              let feature = layer.feature(iFeature)
              // ToDo: once we have feature IDs in place we can get rid of this check against a hardtyped URL
              if (layerKey.startsWith('v1.tiles.census_block.')){
                formatCensusBlockData( feature )
              }
            features.push(feature)
          }
          layerToFeatures[layerKey] = features
        })
        // If there is no data, we won't get a layer in the vector tile. Make sure we set it to an empty array of features.
        layerDefinitions.forEach((layerDefinition) => {
          if (!layerToFeatures.hasOwnProperty(layerDefinition.dataId)) {
            layerToFeatures[layerDefinition.dataId] = []
          }
        })
        resolve(layerToFeatures)
      }
      oReq.onerror = function(error) { reject(error) }
      oReq.onabort = function() { reject('XMLHttpRequest abort') }
      oReq.ontimeout = function() { reject('XMLHttpRequest timeout') }
      oReq.send(JSON.stringify(layerDefinitions))
    })
  }

  // Returns a promise that will (once it is resolved) deliver the tile data for this tile.
  var getTileDataProviderCache = (tileDefinition, zoom, tileX, tileY) => {
    const tileId = `${zoom}-${tileX}-${tileY}`
    if (!tileDataService.tileProviderCache.hasOwnProperty(tileId)) {
      tileDataService.tileProviderCache[tileId] = {}
    }

    var tileProviderCache = tileDataService.tileProviderCache[tileId]
    if (tileProviderCache.hasOwnProperty(tileDefinition.dataId)) {
      // We already have a data provider for this tile definition. Return it.
      return tileProviderCache[tileDefinition.dataId]
    } else {
      // We need to create a data provider for this tile definition. Make sure we download all the map layers
      // that we do not have in a single call.
      // First, add the current tile definition. Doing it this way so that even if the maplayers have changed
      // by the time we get here, we still always guarantee that we will provide data for the requested tile definition.
      var postBody = [tileDefinition]
      // Next, add everything from the map layers that has not already been downloaded.
      Object.keys(tileDataService.mapLayers).forEach((mapLayerKey) => {
        const mapLayer = tileDataService.mapLayers[mapLayerKey]
        mapLayer.tileDefinitions.forEach((mapLayerTileDef) => {
          if (!tileProviderCache.hasOwnProperty(mapLayerTileDef.dataId) && (mapLayerTileDef.dataId !== tileDefinition.dataId)) {
            postBody.push(mapLayerTileDef)
          }
        })
      })
      // Wrap a promise that will make the request
      const mapLayers = tileDataService.mapLayers // Save them in case they change while the promise is resolving.
      var dataPromise = tileDataService.getMapData(postBody, zoom, tileX, tileY)
        .then((layerToFeatures) => {
          Object.keys(mapLayers).forEach((mapLayerKey) => {
            const mapLayer = tileDataService.mapLayers[mapLayerKey]
            mapLayer.tileDefinitions.forEach((mapLayerTileDef) => {
              tileDataService.tileProviderCache[tileId][mapLayerTileDef.dataId] = Promise.resolve(layerToFeatures)
            })
          })
          return tileDataService.tileProviderCache[tileId][tileDefinition.dataId]
        })
        .catch((err) => console.error(err))
        Object.keys(tileDataService.mapLayers).forEach((mapLayerKey) => {
          const mapLayer = tileDataService.mapLayers[mapLayerKey]
          mapLayer.tileDefinitions.forEach((mapLayerTileDef) => {
            tileDataService.tileProviderCache[tileId][mapLayerTileDef.dataId] = dataPromise
          })
        })
        return dataPromise
      }
  }

  var getTileDataSingleDefinition = (tileDefinition, zoom, tileX, tileY) => {
    const tileId = `${zoom}-${tileX}-${tileY}`
    if (!tileDataService.tileDataCache.hasOwnProperty(tileId)) {
      // There is no data object for this tile. Create an empty one.
      tileDataService.tileDataCache[tileId] = {}
    }
    const thisTileDataCache = tileDataService.tileDataCache[tileId]
    if (thisTileDataCache.hasOwnProperty(tileDefinition.dataId)) {
      // We have the required data stored as a promise. Return it.
      return thisTileDataCache[tileDefinition.dataId]
    } else {
      // We don't have any data for this tile. Get it from the server.
      return getTileDataProviderCache(tileDefinition, zoom, tileX, tileY)
        .then((result) => {
          // Save the results of just this tile definition. The server may return other definitions, they will
          // be saved by the corresponding calls for those definitions.
          var layerResult = {}
          layerResult[tileDefinition.dataId] = result[tileDefinition.dataId]
          thisTileDataCache[tileDefinition.dataId] = Promise.resolve(layerResult)
          return thisTileDataCache[tileDefinition.dataId]
        })
        .catch((err) => console.error(err))
    }
  }

  var formatCensusBlockData = function(cBlock){
	let sepA = ';'
	let sepB = ':'
    cBlock.properties.layerType = 'census_block' // ToDo: once we have server-side feature naming we wont need this
    	let kvPairs = cBlock.properties.tags.split( sepA )
    	cBlock.properties.tags = {}
    	kvPairs.forEach((pair) => {
    	  let kv = pair.split( sepB )
    	  // incase there are extra ':'s in the value we join all but the first together 
    	  if ("" != kv[0]) cBlock.properties.tags[ kv[0]+"" ] = kv.slice(1).join( sepB )
    	}) 
    //return cBlock 
  }
  
  // Flattens all URLs and returns tile data that is a simple union of all features
  tileDataService.getTileDataFlatten = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from, and we want a simple union of the results
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.tileDefinitions.forEach((tileDefinition) => promises.push(getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY)))
      var hasIcon = mapLayer.hasOwnProperty('iconUrl')
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
      
      var hasSelectedIcon = mapLayer.hasOwnProperty('selectedIconUrl')
      if (hasSelectedIcon) {
        promises.push(new Promise((resolve, reject) => {
          var img = new Image()
          img.src = mapLayer.selectedIconUrl
          img.onload = () => {
            // Image has been loaded
            resolve(img)
          }
        }))
      }
      
      Promise.all(promises)
        .then((results) => {
          var allFeatures = []
          var numDataResults = results.length - (hasIcon + hasSelectedIcon) // booleans are 0 or 1 so True + True = 2
          
          for (var iResult = 0; iResult < numDataResults; ++iResult) {
            var result = results[iResult]
            var layerToFeatures = result
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
            tileData.icon = results[results.length - (hasIcon + hasSelectedIcon)]
          }
          if (hasSelectedIcon) {
            tileData.selectedIcon = results[results.length - 1]
          }
          //console.log(tileData)
          resolve(tileData)
        })
    })
  }

  // Returns aggregated results for a tile
  tileDataService.getTileDataAggregated = (mapLayer, zoom, tileX, tileY) => {
    // We have multiple URLs where data is coming from. Return the aggregated result
    return new Promise((resolve, reject) => {
      var promises = []
      mapLayer.tileDefinitions.forEach((tileDefinition) => promises.push(getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY)))
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
            var layerToFeatures = result
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

  // Add a modified feature to the set of modified features
  tileDataService.addModifiedFeature = (feature) => {
    tileDataService.modifiedFeatures[feature.objectId] = feature
  }

  // Clear the entire tile data cache
  tileDataService.clearDataCache = () => {
    tileDataService.tileDataCache = {}
    tileDataService.tileProviderCache = {}
    tileDataService.featuresToExclude = new Set()
    tileDataService.modifiedFeatures = {}
  }

  // Clear only those entries in the tile data cache containing the specified keywords
  tileDataService.clearDataCacheContaining = (keywords) => {
    // Clear data from the data cache
    Object.keys(tileDataService.tileDataCache).forEach((tileId) => {
      var singleTileCache = tileDataService.tileDataCache[tileId]
      Object.keys(singleTileCache).forEach((cacheKey) => {
        var shouldDelete = false
        keywords.forEach((keyword) => shouldDelete = shouldDelete || (cacheKey.indexOf(keyword) >= 0))
        if (shouldDelete) {
          delete tileDataService.tileDataCache[tileId][cacheKey]
        }
      })
    })

    // Clear data from the data provider cache
    Object.keys(tileDataService.tileProviderCache).forEach((tileId) => {
      var singleTileProvider = tileDataService.tileProviderCache[tileId]
      Object.keys(singleTileProvider).forEach((cacheKey) => {
        var shouldDelete = false
        keywords.forEach((keyword) => shouldDelete = shouldDelete || (cacheKey.indexOf(keyword) >= 0))
        if (shouldDelete) {
          // Delete the pointer to the promise. This kind of leaves a "dangling" set of data, since the
          // promise will contain the data for this and for other layers. However, since we deleted
          // the pointer to the promise, our code will never access that dangling data.
          delete tileDataService.tileProviderCache[tileId][cacheKey]
        }
      })
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
