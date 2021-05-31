import AsyncQueue from 'async/queue'
import SocketTileFetcher from './tile-data-fetchers/SocketTileFetcher'
import HttpTileFetcher from './tile-data-fetchers/HttpTileFetcher'
import PuppeteerMessages from '../common/puppeteer-messages'

class TileDataService {

  constructor($http) {
    this.$http = $http

    this.tileDataCache = {}
    this.tileProviderCache = {}
    this.tileHtmlCache = {} // A cache of HTML elements created. Used to prevent flicker.
    // Hold a map of layer keys to image urls (and image data once it is loaded)
    this.entityImageCache = {}
    this.featuresToExclude = new Set() // Locations with these location ids will not be rendered
    this.modifiedFeatures = {} // A set of features (keyed by objectId) that are modified from their original position
    this.modifiedBoundaries = {}
    this.mapLayers = {}
    this.tileFetchers = [
      { description: 'HTTP (legacy)', fetcher: new HttpTileFetcher() },
      { description: 'Websockets', fetcher: new SocketTileFetcher() }
    ]
    this.activeTileFetcher = this.tileFetchers[1]
    this.noDataTileTypes = []

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

    // Detect when the queue has drained (finished fetching data). If a callback function exists on the window, call it.
    // This is used by the PDF report generator to detect when we are finished fetching all vector tile data.
    this.httpThrottle.drain = () => PuppeteerMessages.vectorTilesDataFetchedCallback()

    this.locationStates = {
      LOCK_ICON_KEY: 'LOCK_ICON_KEY',
      INVALIDATED_ICON_KEY: 'INVALIDATED_ICON_KEY'
    }
  }

  isWithinBounds (boxZoom, zoom, x, y, x1, y1, x2, y2) {
    const scaleFactor = 1 << (boxZoom - zoom)
    const wx1 = x * scaleFactor
    const wx2 = (x + 1) * scaleFactor

    const wy1 = y * scaleFactor
    const wy2 = (y + 1) * scaleFactor

    // Rectangles must not be to the Left of each other 
    // And Rectangles must not be above each other
    // This generalizes to points

    return (!(wx1 > x2 || x1 > wx2) &&
            !(wy2 < y1 || y2 < wy1))
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
      // layerDefinitions must be unique (keyed by dataId), or else we get an exception from service
      const uniqueLayerDefinitions = []
      layerDefinitions.forEach(layerDefinition => {
        if (!uniqueLayerDefinitions.find(item => item.dataId === layerDefinition.dataId)) {
          uniqueLayerDefinitions.push(layerDefinition)
        }
      })
      // Remember to throttle all vector tile http requests.
      this.httpThrottle.push(() => this.activeTileFetcher.fetcher.getMapData(uniqueLayerDefinitions, zoom, tileX, tileY), (result) => {
        if (result.status === 'success') {
          resolve(result.data)
        } else {
          reject(result.data)
        }
      })
    })
  }

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

      // Exclude all the tile definition without data before download.
      let excludeNoDataTileDefinitions = []
      if (this.noDataTileTypes.length) {
        excludeNoDataTileDefinitions = tileDefinitionsToDownload.filter((item) => {
          return !this.noDataTileTypes.includes(item.fiberType)
        })
      }

      // Check whether tile without data is present, if not download all the tileDefinitions.
      const tileDefinitions = this.noDataTileTypes.length ? excludeNoDataTileDefinitions : tileDefinitionsToDownload

      // Wrap a promise that will make the request
      var dataPromise = this.getMapData(tileDefinitions, zoom, tileX, tileY)
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
          if(result) {
            // Save the results of just this tile definition. The server may return other definitions, they will
            // be saved by the corresponding calls for those definitions.
            var layerResult = {}
            layerResult[tileDefinition.dataId] = result[tileDefinition.dataId]
            thisTileDataCache[tileDefinition.dataId] = Promise.resolve(layerResult)
            return thisTileDataCache[tileDefinition.dataId]
          } else {
            // If the tile has no data from service, remove it from the future requests.
            if (tileDefinition.hasOwnProperty('fiberType')) {
              if (this.noDataTileTypes.indexOf(tileDefinition.fiberType) === -1) {
                this.noDataTileTypes.push(tileDefinition.fiberType)
              }
            }
            return thisTileDataCache[tileDefinition.dataId] = []
          }
        })
        .catch((err) => console.error(err))
    }
  }

  // Flattens all URLs and returns tile data that is a simple union of all features
  getTileDataFlatten (mapLayer, zoom, tileX, tileY) {
    // We have multiple URLs where data is coming from, and we want a simple union of the results
    var promises = []
    mapLayer.tileDefinitions.forEach((tileDefinition) => promises.push(this.getTileDataSingleDefinition(tileDefinition, zoom, tileX, tileY)))

    // Get all icons that can potentially be used for the filters
    const v2Filters = mapLayer.v2Filters || []
    const filterIconUrls = [...new Set(v2Filters.map(v2Filter => v2Filter.onPass.iconUrl))]
    filterIconUrls.forEach(filterIconUrl => {
      if (!this.getEntityImageForLayer(filterIconUrl)) {
        this.addEntityImageForLayer(filterIconUrl, filterIconUrl)
      }
      promises.push(this.getEntityImageForLayer(filterIconUrl))
    })

    // A promise that will return an Image from a URL
    var imagePromise = (url) => new Promise((resolve, reject) => {
      var img = new Image()
      img.src = url
      img.onload = () => {
        // Image has been loaded
        resolve(img)
      }
      img.onerror = () => {
        // Not printing an error message here as it will fill up the console. Just render an error icon instead
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH4wQJDBUloSfh8QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAERSURBVDjLpdMxSgNREAbgb5dFMGBlGaxyhvR7huQCEtIEBQvrYGFjkRQWYmFIYx/wBq/xJB4hkBQGscgYo+6ugq95MPP///wz816WOMIQC7yUvGk4iRwn6GGWY4AJHtFJZA3kDJ3ATjDIMY9AF1doV4lErB2YbnDmeckSI9yhj5sakeOo2g/sqGSZQ8ka4zqRRAvXkXvAODhfqyQOA3iGJ5xjhWkMeobLchsDxb5AyTptnRxEW8tInVaRfzjYc9LCbWxIDPriO5ntTv91iprq07A932thkypaKGrIu4FFahMxVSI7cuI+8Rp36y+5vwEaMFmV7UqLNS0W8at+Jcc7WaXPuQzx/OGgh0UTucJJD4t3tvRnsAEYLucAAAAASUVORK5CYII='
        resolve(img)
      }
    })

    const hasIcon = Boolean(mapLayer.iconUrl)
    if (mapLayer.iconUrl) {
      promises.push(imagePromise(mapLayer.iconUrl))
    }

    const hasSelectedIcon = Boolean(mapLayer.selectedIconUrl)
    if (hasSelectedIcon) {
      promises.push(imagePromise(mapLayer.selectedIconUrl))
    }

    const hasGreyedOutIcon = Boolean(mapLayer.greyOutIconUrl)
    if (hasGreyedOutIcon) {
      promises.push(imagePromise(mapLayer.greyOutIconUrl))
    }

    const hasMDUIcon = Boolean(mapLayer.mduIconUrl)
    if (hasMDUIcon) {
      promises.push(imagePromise(mapLayer.mduIconUrl))
    }

    return Promise.all(promises)
      .then((results) => {
        var allFeatures = []
        var numDataResults = mapLayer.tileDefinitions.length

        for (var iResult = 0; iResult < numDataResults; ++iResult) {
          var result = results.splice(0, 1)[0]
          var layerToFeatures = result
          Object.keys(layerToFeatures).forEach((layerKey) => {
            // There can be no data for tiles, so ignore it.
            if (layerToFeatures[layerKey]) {
              allFeatures = allFeatures.concat(layerToFeatures[layerKey])
            }
          })
        }
        var tileData = {
          layerToFeatures: {
            FEATURES_FLATTENED: allFeatures
          }
        }

        tileData.v2FilterIcons = {}
        for (iResult = 0; iResult < filterIconUrls.length; ++iResult) {
          const iconResult = results.splice(0, 1)[0]
          tileData.v2FilterIcons[filterIconUrls[iResult]] = iconResult
        }

        if (hasIcon) {
          tileData.icon = results.splice(0, 1)[0]
        }
        if (hasSelectedIcon) {
          tileData.selectedIcon = results.splice(0, 1)[0]
        }
        if (hasGreyedOutIcon) {
          tileData.greyOutIcon = results.splice(0, 1)[0]
        }
        if (hasMDUIcon) {
          tileData.mduIcon = results.splice(0, 1)[0]
        }
        return Promise.resolve(tileData)
      })
  }

  // Returns aggregated results for a tile
  getTileDataAggregated (mapLayer, zoom, tileX, tileY) {
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
              entityData[aggregateEntityGID].geometry = feature.loadGeometry()
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
  addEntityImageForLayer (layerKey, imageUrl) {
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

  // Returns a promise for the image associated with a layer key. Can return null
  getEntityImageForLayer (layerKey) {
    return this.entityImageCache[layerKey]
  }

  // Add a specified location ID to the set of features to be excluded from the render
  addFeatureToExclude (featureId) {
    this.featuresToExclude.add(featureId)
  }

  // Add a specified location ID to the set of features to be excluded from the render
  removeFeatureToExclude (featureId) {
    this.featuresToExclude.delete(featureId)
  }

  // Add a modified feature to the set of modified features
  addModifiedFeature (feature) {
    this.modifiedFeatures[feature.objectId] = feature
  }

  // Add a modified boundary to the set of modified features
  addModifiedBoundary (feature) {
    this.modifiedBoundaries[feature.objectId] = feature
  }

  // Clear the entire tile data cache
  clearDataCache () {
    this.tileDataCache = {}
    this.tileProviderCache = {}
    this.featuresToExclude = new Set()
    this.modifiedFeatures = {}
    this.modifiedBoundaries = {}
  }

  _clearCacheInTileBox (cache, regexes, tileBox) {
    Object.keys(cache).forEach(cacheKey => {
      // Get the zoom, x and y from the html cache key
      const components = cacheKey.split('-')
      const tileZoom = +components[0]
      const tileX = +components[1]
      const tileY = +components[2]
      if (this.isWithinBounds(tileBox.zoom, tileZoom, tileX, tileY, tileBox.x1, tileBox.y1, tileBox.x2, tileBox.y2)) {
        // Delete all invalidated layers
        const tileCache = cache[cacheKey]
        Object.keys(tileCache).forEach(tileCacheKey => {
          if (this.doesNamePassAnyRegex(tileCacheKey, regexes)) {
            delete tileCache[tileCacheKey]
          }
        })
      }
    })
  }

  clearCacheInTileBox (layerNameRegexStrings, tileBox) {
    const regexes = layerNameRegexStrings.map(layerNameRegexString => new RegExp(layerNameRegexString))
    this._clearCacheInTileBox(this.tileDataCache, regexes, tileBox)
    this._clearCacheInTileBox(this.tileProviderCache, regexes, tileBox)
  }

  displayInvalidatedTiles (layerNameRegexStrings, tileBox) {
    const regexes = layerNameRegexStrings.map(layerNameRegexString => new RegExp(layerNameRegexString))
    Object.keys(this.tileHtmlCache).forEach(htmlCacheKey => {
      // Get the zoom, x and y from the html cache key
      const components = htmlCacheKey.split('-')
      const tileZoom = +components[0]
      const tileX = +components[1]
      const tileY = +components[2]
      if (this.isWithinBounds(tileBox.zoom, tileZoom, tileX, tileY, tileBox.x1, tileBox.y1, tileBox.x2, tileBox.y2)) {
        // This tile is within bounds, but we want to show the stale-data-div ONLY if at least one layer is invalidated
        const tileDataKey = `${tileZoom}-${tileX}-${tileY}` // Do not use htmlCacheKey, that has a fourth component
        const tileData = this.tileDataCache[tileDataKey]
        var hasInvalidatedLayer = false
        Object.keys(tileData).forEach(key => {
          if (this.doesNamePassAnyRegex(key, regexes)) {
            hasInvalidatedLayer = true
          }
        })
        if (hasInvalidatedLayer) {
          // Show a div that indicated whether the data in this tile is stale. The div will be hidden after the div is rendered
          const staleDataDiv = this.tileHtmlCache[htmlCacheKey].staleDataDiv
          staleDataDiv.style.display = 'block'
        }
      }
    })
  }

  // Returns true if the layer name passes any of the regex strings in the list
  doesNamePassAnyRegex (layerName, regexes) {
    var regexPassed = false
    for (var iRegex = 0; iRegex < regexes.length; ++iRegex) {
      if (regexes[iRegex].test(layerName)) {
        regexPassed = true
        break
      }
    }
    return regexPassed
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
