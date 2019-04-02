import { VectorTile } from 'vector-tile'
import Protobuf from 'pbf'

class HttpTileFetcher {
  // Returns a promise that will eventually provide map data for all the layer definitions in the specified tile
  getMapData(layerDefinitions, zoom, tileX, tileY) {
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
}

export default HttpTileFetcher