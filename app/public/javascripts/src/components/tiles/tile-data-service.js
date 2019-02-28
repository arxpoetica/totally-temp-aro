import io from 'socket.io-client'
// IMPORTANT: The vector-tile, pbf and async bundles must have been included before this point
const VectorTile = require('vector-tile').VectorTile
const Protobuf = require('pbf')
const AsyncQueue = require('async').queue

class TileDataService {

  constructor($http) {
    this.$http = $http
    this.socket = io()

    this.tileDataCache = {}
    this.tileProviderCache = {}
    this.tileHtmlCache = {} // A cache of HTML elements created. Used to prevent flicker.
    // Hold a map of layer keys to image urls (and image data once it is loaded)
    this.entityImageCache = {}
    this.featuresToExclude = new Set() // Locations with these location ids will not be rendered
    this.modifiedFeatures = {} // A set of features (keyed by objectId) that are modified from their original position
    this.modifiedBoundaries = {}
    this.mapLayers = {}
    this.tileReceivers = {}
    this.setupSocketReceivers()

    // For Chrome, Firefox 3+, Safari 5+, the browser throttles all http 1 requests to 6 maximum concurrent requests.
    // If we have a large number of vector tile requests, then any other calls to aro-service get queued after these,
    // and the app appears unresponsive until all vector tiles are loaded. To get around this, we are going to limit the
    // number of concurrent vector tiles requests, so as to keep at least 1 "slot" open for other quick  aro-service requests.
    const MAX_CONCURRENT_VECTOR_TILE_REQUESTS = 5
    this.httpThrottle = new AsyncQueue((task, callback) => {
      // We expect 'task' to be a promise. Call the callback after the promise resolves or rejects.
      task()
        .then((result) => callback({ status: 'success', data: result }))
        .catch((err) => callback({ status: 'failure', data: err }))
    }, MAX_CONCURRENT_VECTOR_TILE_REQUESTS)

    this.locationStates = {
      LOCK_ICON_KEY: 'LOCK_ICON_KEY',
      INVALIDATED_ICON_KEY: 'INVALIDATED_ICON_KEY'
    }
  }

  setLocationStateIcon(locationState, iconUrl) {
    this.addEntityImageForLayer(locationState, iconUrl)
  }

  getTileData(mapLayer, zoom, tileX, tileY) {
    if (!mapLayer.aggregateMode || mapLayer.aggregateMode === 'NONE' || mapLayer.aggregateMode === 'FLATTEN') {
      // We have one or multiple URLs where data is coming from, and we want a simple union of the results
      return this.getTileDataFlatten(mapLayer, zoom, tileX, tileY)
    } else if (mapLayer.aggregateMode === 'BY_ID') {
      // We want to aggregate by feature id
      return this.getTileDataAggregated(mapLayer, zoom, tileX, tileY)
    } else {
      return Promise.reject(`Unknown aggregate mode: ${mapLayer.aggregateMode}`)
    }
  }

  // Sets the current list of map layers
  setMapLayers(mapLayers) {
    this.mapLayers = mapLayers
  }

  // Returns a promise that will eventually provide map data for all the layer definitions in the specified tile
  getMapData(layerDefinitions, zoom, tileX, tileY) {
    return new Promise((resolve, reject) => {
      // Remember to throttle all vector tile http requests.
      this.httpThrottle.push(() => this.getMapDataInternalSockets(layerDefinitions, zoom, tileX, tileY), (result) => {
        if (result.status === 'success') {
          resolve(result.data)
        } else {
          reject(result.data)
        }
      })
    })
  }

  // Returns a promise that will eventually provide map data for all the layer definitions in the specified tile
  // IMPORTANT: This will immediately fire a HTTP request, so do not use this method directly. Use getMapData().
  getMapDataInternal(layerDefinitions, zoom, tileX, tileY) {
    return new Promise((resolve, reject) => {
      // Getting binary data from the server. Directly use XMLHttpRequest()
      var oReq = new XMLHttpRequest()
      oReq.open('POST', `/tile/v1/tiles/layers/${zoom}/${tileX}/${tileY}.mvt`, true)
      oReq.setRequestHeader('Content-Type', 'application/json')
      oReq.responseType = 'arraybuffer'

      oReq.onload = function (oEvent) {
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
            if (layerKey.startsWith('v1.tiles.census_block.')) {
              formatCensusBlockData(feature)
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
      oReq.onerror = function (error) { reject(error) }
      oReq.onabort = function () { reject('XMLHttpRequest abort') }
      oReq.ontimeout = function () { reject('XMLHttpRequest timeout') }
      oReq.onreadystatechange = function () {
        if (oReq.readyState === 4 && oReq.status >= 400) {
          reject(`ERROR: Tile data URL returned status code ${oReq.status}`)
        }
      }
      oReq.send(JSON.stringify(layerDefinitions))
    })
  }

  // ------------------------------ START new vector-tile-via-websockets section ----------------------
  setupSocketReceivers() {
    this.socket.emit('SOCKET_SUBSCRIBE_TO_ROOM', '/vectorTiles')
    this.socket.on('VECTOR_TILE_DATA', (binaryMessage) => {
      // Is there a better way to perform the arraybuffer decoding?
      const stringMessage = new TextDecoder('utf-8').decode(new Uint8Array(binaryMessage.content))
      const messageObj = JSON.parse(stringMessage)
      const mvtData = Uint8Array.from(atob(messageObj.data), c => c.charCodeAt(0))
      var mapboxVectorTile = new VectorTile(new Protobuf(mvtData))
      // Save the features in a per-layer object
      var layerToFeatures = {}
      Object.keys(mapboxVectorTile.layers).forEach((layerKey) => {
        var layer = mapboxVectorTile.layers[layerKey]
        var features = []
        for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
          let feature = layer.feature(iFeature)
          // ToDo: once we have feature IDs in place we can get rid of this check against a hardtyped URL
          if (layerKey.startsWith('v1.tiles.census_block.')) {
            formatCensusBlockData(feature)
          }
          features.push(feature)
        }
        layerToFeatures[layerKey] = features
      })
      if (!this.tileReceivers.hasOwnProperty(messageObj.uuid)) {
        // If we don't have this UUID in our list yet, that means we got tile data back even before the original
        // POST request completed. In this case we are going to store the result, and let the original POST handler
        // take care of everything
        this.tileReceivers[messageObj.uuid] = {
          binaryMessage: binaryMessage
        }
      } else {
        // At this point the POST request has completed and we can process the socket response here
        this.tileReceivers[messageObj.uuid].binaryMessage = binaryMessage
        this.processSocketData(this.tileReceivers[messageObj.uuid])
        // Remove the receiver data
        delete this.tileReceivers[messageObj.uuid]
      }
    })
  }

  processSocketData(receiver) {
    // Is there a better way to perform the arraybuffer decoding?
    const stringMessage = new TextDecoder('utf-8').decode(new Uint8Array(receiver.binaryMessage.content))
    const messageObj = JSON.parse(stringMessage)
    const mvtData = Uint8Array.from(atob(messageObj.data), c => c.charCodeAt(0))
    var mapboxVectorTile = new VectorTile(new Protobuf(mvtData))
    // Save the features in a per-layer object
    var layerToFeatures = {}
    Object.keys(mapboxVectorTile.layers).forEach((layerKey) => {
      var layer = mapboxVectorTile.layers[layerKey]
      var features = []
      for (var iFeature = 0; iFeature < layer.length; ++iFeature) {
        let feature = layer.feature(iFeature)
        // ToDo: once we have feature IDs in place we can get rid of this check against a hardtyped URL
        if (layerKey.startsWith('v1.tiles.census_block.')) {
          formatCensusBlockData(feature)
        }
        features.push(feature)
      }
      layerToFeatures[layerKey] = features
    })
    // At this point the POST request has completed and we can resolve the promise here
    // If there is no data, we won't get a layer in the vector tile. Make sure we set it to an empty array of features.
    receiver.layerDefinitions.forEach(layerDefinition => {
      if (!layerToFeatures.hasOwnProperty(layerDefinition.dataId)) {
        layerToFeatures[layerDefinition.dataId] = []
      }
    })
    receiver.resolve(layerToFeatures)
  }

  // Returns a promise that will eventually provide map data for all the layer definitions in the specified tile
  // IMPORTANT: This will immediately fire a HTTP request, so do not use this method directly. Use getMapData().
  getMapDataInternalSockets(layerDefinitions, zoom, tileX, tileY) {

    const mapDataPromise = new Promise((resolve, reject) => {
      this.$http.post(`/tile/v1/async/tiles/layers/${zoom}/${tileX}/${tileY}.mvt`, layerDefinitions)
        .then(result => {
          const requestUuid = JSON.parse(result.data) // result.data has quotes around it, so JON.parse..ing
          if (this.tileReceivers[requestUuid]) {
            // This means that our websocket has already received data for this request. Go ahead and proces it.
            var receiver = this.tileReceivers[requestUuid] // This will now have the "binaryData" field set
            receiver.resolve = resolve
            receiver.reject = reject
            receiver.layerDefinitions = layerDefinitions
            this.processSocketData(receiver)
          } else {
            // We don't have the socket data yet. Save the receiver so we can use it later
            const receiver = {
              uuid: requestUuid,
              resolve: resolve,
              reject: reject,
              layerDefinitions: layerDefinitions
            }
            this.tileReceivers[requestUuid] = receiver
          }
          return Promise.resolve()
        })
        .catch(err => {
          console.error('ERROR when trying to POST for async vector tile data')
          console.error(err)
        })
    })

    return mapDataPromise
  }

  // ------------------------------ END new vector-tile-via-websockets section ----------------------

  // Returns a promise that will (once it is resolved) deliver the tile data for this tile.
  getTileDataProviderCache(tileDefinition, zoom, tileX, tileY) {
    const tileId = `${zoom}-${tileX}-${tileY}`
    if (!this.tileProviderCache.hasOwnProperty(tileId)) {
      this.tileProviderCache[tileId] = {}
    }

    var tileProviderCache = this.tileProviderCache[tileId]
    if (tileProviderCache.hasOwnProperty(tileDefinition.dataId)) {
      // We already have a data provider for this tile definition. Return it.
      return tileProviderCache[tileDefinition.dataId]
    } else {
      // We need to create a data provider for this tile definition. Make sure we download all the map layers
      // that we do not have in a single call.
      // First, add the current tile definition. Doing it this way so that even if the maplayers have changed
      // by the time we get here, we still always guarantee that we will provide data for the requested tile definition.
      var tileDefinitionsToDownload = [tileDefinition]
      // Next, add everything from the map layers that has not already been downloaded.
      Object.keys(this.mapLayers).forEach((mapLayerKey) => {
        const mapLayer = this.mapLayers[mapLayerKey]
        mapLayer.tileDefinitions.forEach((mapLayerTileDef) => {
          if (!tileProviderCache.hasOwnProperty(mapLayerTileDef.dataId) && (mapLayerTileDef.dataId !== tileDefinition.dataId)) {
            tileDefinitionsToDownload.push(mapLayerTileDef)
          }
        })
      })
      // Wrap a promise that will make the request
      var dataPromise = this.getMapData(tileDefinitionsToDownload, zoom, tileX, tileY)
        .catch((err) => {
          console.error(err)
          // There was a server error when getting the data. Delete this promise from the tileProviderCache
          // so that the system will re-try downloading tile data if it is asked for again
          tileDefinitionsToDownload.forEach((tileDefinitionToDownload) => {
            delete this.tileProviderCache[tileId][tileDefinitionToDownload.dataId]
          })
        })
      // For all the tile definitions that we are going to download, this is the promise that we save.
      // Note that some map layers may have been downloaded previously. We have to be careful not to overwrite those promises.
      // Hence, using tileDefinitionsToDownload and not this.mapLayers
      tileDefinitionsToDownload.forEach((tileDefinitionToDownload) => {
        this.tileProviderCache[tileId][tileDefinitionToDownload.dataId] = dataPromise
      })
      return dataPromise
    }
  }

  getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY) {
    const tileId = `${zoom}-${tileX}-${tileY}`
    if (!this.tileDataCache.hasOwnProperty(tileId)) {
      // There is no data object for this tile. Create an empty one.
      this.tileDataCache[tileId] = {}
    }
    const thisTileDataCache = this.tileDataCache[tileId]
    if (thisTileDataCache.hasOwnProperty(tileDefinition.dataId)) {
      // We have the required data stored as a promise. Return it.
      return thisTileDataCache[tileDefinition.dataId]
    } else {
      // We don't have any data for this tile. Get it from the server.
      return this.getTileDataProviderCache(tileDefinition, zoom, tileX, tileY)
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

  formatCensusBlockData(cBlock) {
    let sepA = ';'
    let sepB = ':'
    cBlock.properties.layerType = 'census_block' // ToDo: once we have server-side feature naming we wont need this
  	let kvPairs = cBlock.properties.tags.split(sepA)
  	cBlock.properties.tags = {}
  	kvPairs.forEach((pair) => {
  	  let kv = pair.split(sepB)
  	  // incase there are extra ':'s in the value we join all but the first together
  	  if (kv[0] != '') cBlock.properties.tags[ kv[0] + '' ] = kv.slice(1).join(sepB)
  	})
    // return cBlock
  }

  // Flattens all URLs and returns tile data that is a simple union of all features
  getTileDataFlatten(mapLayer, zoom, tileX, tileY) {
    // We have multiple URLs where data is coming from, and we want a simple union of the results
    var promises = []
    mapLayer.tileDefinitions.forEach((tileDefinition) => promises.push(this.getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY)))

    // A promise that will return an Image from a URL
    var imagePromise = (url) => new Promise((resolve, reject) => {
      var img = new Image()
      img.src = url
      img.onload = () => {
        // Image has been loaded
        resolve(img)
      }
    })

    var hasIcon = mapLayer.hasOwnProperty('iconUrl')
    if (hasIcon) {
      promises.push(imagePromise(mapLayer.iconUrl))
    }

    var hasSelectedIcon = mapLayer.hasOwnProperty('selectedIconUrl')
    if (hasSelectedIcon) {
      promises.push(imagePromise(mapLayer.selectedIconUrl))
    }

    var hasGreyedOutIcon = mapLayer.hasOwnProperty('greyOutIconUrl') && mapLayer.greyOutIconUrl !== undefined
    if (hasGreyedOutIcon) {
      promises.push(imagePromise(mapLayer.greyOutIconUrl))
    }

    return Promise.all(promises)
      .then((results) => {
        var allFeatures = []
        var numDataResults = results.length - (hasIcon + hasSelectedIcon + hasGreyedOutIcon) // booleans are 0 or 1 so True + True = 2

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
          tileData.icon = results[results.length - (hasIcon + hasSelectedIcon + hasGreyedOutIcon)]
        }
        if (hasSelectedIcon) {
          tileData.selectedIcon = results[results.length - ((hasIcon + hasGreyedOutIcon))]
        }
        if (hasGreyedOutIcon) {
          tileData.greyOutIcon = results[results.length - 1]
        }
        return Promise.resolve(tileData)
      })
  }

  // Returns aggregated results for a tile
  getTileDataAggregated(mapLayer, zoom, tileX, tileY) {
    // We have multiple URLs where data is coming from. Return the aggregated result
    var promises = []
    mapLayer.tileDefinitions.forEach((tileDefinition) => promises.push(this.getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY)))
    return Promise.all(promises)
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
              // TODO: Cannot do a "import TileUtilities from './tile-utilities'" so we have copy/pasted code here
              const TILE_COORDINATE_SCALING_FACTOR = 1.0 / 16
              const scaledGeom = feature.loadGeometry().map(shape => ({ x: shape.x * TILE_COORDINATE_SCALING_FACTOR, y: shape.y * TILE_COORDINATE_SCALING_FACTOR }))
              entityData[aggregateEntityGID].geometry = scaledGeom
              // Store the value to be aggregated (e.g. download_speed) in this layer
              if (!entityData[aggregateEntityGID].layers) {
                entityData[aggregateEntityGID].layers = []
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
        return Promise.resolve({
          layerToFeatures: {
            AGGREGATE_LAYER: aggregateFeatures
          }
        })
      })
  }

  // Adds a layer key and url to the tile data service
  addEntityImageForLayer(layerKey, imageUrl) {
    if (this.entityImageCache[layerKey]) {
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
    this.entityImageCache[layerKey] = imageLoadedPromise
  }

  // Returns a promise for the image associated with a layer key
  getEntityImageForLayer(layerKey) {
    var entityImagePromise = this.entityImageCache[layerKey]
    if (!entityImagePromise) {
      throw 'No promise for image with layerKey ' + layerKey
    }
    return entityImagePromise
  }

  // Add a specified location ID to the set of features to be excluded from the render
  addFeatureToExclude(featureId) {
    this.featuresToExclude.add(featureId)
  }

  // Add a specified location ID to the set of features to be excluded from the render
  removeFeatureToExclude(featureId) {
    this.featuresToExclude.delete(featureId)
  }

  // Add a modified feature to the set of modified features
  addModifiedFeature(feature) {
    this.modifiedFeatures[feature.objectId] = feature
  }

  // Add a modified boundary to the set of modified features
  addModifiedBoundary(feature) {
    this.modifiedBoundaries[feature.objectId] = feature
  }

  // Clear the entire tile data cache
  clearDataCache() {
    this.tileDataCache = {}
    this.tileProviderCache = {}
    this.featuresToExclude = new Set()
    this.modifiedFeatures = {}
    this.modifiedBoundaries = {}
  }

  // Clear only those entries in the tile data cache containing the specified keywords
  clearDataCacheContaining(keywords) {
    // Clear data from the data cache
    Object.keys(this.tileDataCache).forEach((tileId) => {
      var singleTileCache = this.tileDataCache[tileId]
      Object.keys(singleTileCache).forEach((cacheKey) => {
        var shouldDelete = false
        keywords.forEach((keyword) => shouldDelete = shouldDelete || (cacheKey.indexOf(keyword) >= 0))
        if (shouldDelete) {
          delete this.tileDataCache[tileId][cacheKey]
        }
      })
    })

    // Clear data from the data provider cache
    Object.keys(this.tileProviderCache).forEach((tileId) => {
      var singleTileProvider = this.tileProviderCache[tileId]
      Object.keys(singleTileProvider).forEach((cacheKey) => {
        var shouldDelete = false
        keywords.forEach((keyword) => shouldDelete = shouldDelete || (cacheKey.indexOf(keyword) >= 0))
        if (shouldDelete) {
          // Delete the pointer to the promise. This kind of leaves a "dangling" set of data, since the
          // promise will contain the data for this and for other layers. However, since we deleted
          // the pointer to the promise, our code will never access that dangling data.
          delete this.tileProviderCache[tileId][cacheKey]
        }
      })
    })
  }

  // Mark all tiles in the HTML cache as dirty
  markHtmlCacheDirty(tilesToRefresh) {
    Object.keys(this.tileHtmlCache).forEach((cacheId) => {
      var isDirty = false
      if (tilesToRefresh) {
        // Only mark specified tiles as dirty.
        const matchingTiles = tilesToRefresh.filter((item) => cacheId.indexOf(`${item.zoom}-${item.x}-${item.y}`) === 0)
        isDirty = matchingTiles.length > 0
      } else {
        isDirty = true // Mark all tiles as dirty
      }
      this.tileHtmlCache[cacheId].isDirty = isDirty
    })
  }

  // Remove the specified HTML element from the cache and from the document
  removeHtmlCacheNode(cacheId) {
    if (this.tileHtmlCache.hasOwnProperty(cacheId)) {
      // We have the specified node in our cache
      var htmlTileNode = this.tileHtmlCache[cacheId].div
      htmlTileNode.parentNode.removeChild(htmlTileNode) // Remove the HTML node from the document
      delete this.tileHtmlCache[cacheId] // Remove the reference to the (now non-existent) HTML element
    }
  }

  // Completely erase the entire cache of HTML elements associated with tiles
  clearHtmlCache() {
    this.tileHtmlCache = {}
  }
}

TileDataService.$inject = ['$http']

export default TileDataService
