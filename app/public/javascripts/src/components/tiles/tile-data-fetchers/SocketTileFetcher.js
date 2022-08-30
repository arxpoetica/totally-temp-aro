/* globals angular atob  */
// Helper class to fetch tile data using websockets
import { VectorTile } from 'vector-tile'
import Protobuf from 'pbf'
import AroHttp from '../../../react/common/aro-http'
import uuidv4 from 'uuid/v4'
import { ClientSocketManager } from '../../../react/common/client-sockets'

class SocketTileFetcher {

  constructor () {
    this.tileReceivers = {}
    this.unsubscriber = ClientSocketManager.subscribe('VECTOR_TILE_DATA', message => this._receiveSocketData(message))
  }

  // Returns a promise that will eventually provide map data for all the layer definitions in the specified tile
  getMapData (layerDefinitions, zoom, tileX, tileY) {

    // We are going to fire a POST request to get the vector tile data. The POST request returns a UUID for that
    // request, and we get the (uuid+actual tile data) via websockets. Sometimes, the websocket returns tile data
    // even before the POST request returns. We have to handle both the cases.
    const requestUuid = uuidv4()  // Not cryptographically secure but good enough for our purposes
    // Service will not accept the 'dataId' field in layer definitions. Remove it.
    var layerDefinitionsWithoutDataId = layerDefinitions.map(ld => {
      var ldCopy = angular.copy(ld)
      delete ldCopy.dataId
      return ldCopy
    })
    const mapDataPromise = new Promise((resolve, reject) => {
      ClientSocketManager.getSessionId()
        .then(sessionId => {
          const requestBody = {
            websocketSessionId: sessionId,
            layerDefinitions: layerDefinitionsWithoutDataId
          }
          return AroHttp.post(`/service-tile-sockets/v1/async/tiles/layers/${zoom}/${tileX}/${tileY}.mvt?request_uuid=${requestUuid}`, requestBody)
        })
        .then(result => {
          if (this.tileReceivers[requestUuid]) {
            // This means that our websocket has already received data for this request. Go ahead and proces it.
            var receiver = this.tileReceivers[requestUuid] // This will now have the "binaryData" field set
            receiver.resolve = resolve
            receiver.reject = reject
            receiver.layerDefinitions = layerDefinitions
            this._processSocketData(receiver)
            delete this.tileReceivers[requestUuid]
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
          reject(err)
        })
    })
    return mapDataPromise
  }

  _receiveSocketData (message) {
    // Is there a better way to perform the arraybuffer decoding?
    const stringMessage = new TextDecoder('utf-8').decode(new Uint8Array(message.content))
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
          this.formatCensusBlockData(feature)
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
        binaryMessage: message
      }
    } else {
      // At this point the POST request has completed and we can process the socket response here
      this.tileReceivers[messageObj.uuid].binaryMessage = message
      this._processSocketData(this.tileReceivers[messageObj.uuid])
      // Remove the receiver data
      delete this.tileReceivers[messageObj.uuid]
    }
  }

  _processSocketData (receiver) {
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
          this.formatCensusBlockData(feature)
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

  formatCensusBlockData (cBlock) {
    let sepA = ';'
    let sepB = ':'
    cBlock.properties.layerType = 'census_block' // ToDo: once we have server-side feature naming we wont need this
    let kvPairs = cBlock.properties.tags.split(sepA)
    cBlock.properties.tags = {}
    kvPairs.forEach((pair) => {
      let kv = pair.split(sepB)
      // incase there are extra ':'s in the value we join all but the first together
      if (kv[0] !== '') cBlock.properties.tags[ kv[0] + '' ] = kv.slice(1).join(sepB)
    })
  }
}

export default SocketTileFetcher
