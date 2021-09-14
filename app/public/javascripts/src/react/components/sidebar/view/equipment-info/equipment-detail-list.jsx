import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import MapUtilities from '../../../../../components/common/plan/map-utilities'
import TileDataService from '../../../../../components/tiles/tile-data-service'

const tileDataService = new TileDataService()
const MAX_EQUIPMENT_LIST = 100

export const equipmentDetailList = (props) => {

  const [state, setState] = useState({
    clliToEquipmentInfo: {},
  })

  const { clliToEquipmentInfo } = state
  const { mapRef, mapLayers } = props

  useEffect(() => {
    getVisibleEquipmentIds()
  }, [])

  const getVisibleEquipmentIds = () => {
    if (!mapRef || !mapRef.getBounds()) {
      return
    }
    // Get visible tiles
    var visibleTiles = MapUtilities.getVisibleTiles(mapRef)
    visibleTiles.forEach((tile) => {
      var coord = { x: tile.x, y: tile.y }
      getVisibleTileData(tile.zoom, coord) // fetch tile data
    })
  }

  const getVisibleTileData = (zoom, coord) => {
    var singleTilePromises = []
    var mapLayers = Object.keys(mapLayers.getValue())

    mapLayers.forEach((mapLayerKey, index) => {
      var mapLayer = mapLayers.getValue()[mapLayerKey]
      var xTile = coord.x
      var yTile = coord.y
      var singleTilePromise = tileDataService.getTileData(mapLayer, zoom, xTile, yTile)
      singleTilePromises.push(singleTilePromise)
    })

    return Promise.all(singleTilePromises)
      .then((singleTileResults) => {
        singleTileResults.forEach((featureData, index) => {
          var features = []
          Object.keys(featureData.layerToFeatures).forEach((layerKey) => features = features.concat(featureData.layerToFeatures[layerKey]))
          for (var iFeature = 0; iFeature < features.length; ++iFeature) {
            // Parse the geometry out.
            var feature = features[iFeature]
            if (filterFeature(feature)) {
              clliToEquipmentInfo[feature.properties.object_id] = feature.properties
            }
          }
        })
      })
  }

  constfilterFeature = (feature) => {
    return feature.properties &&
      feature.properties.object_id &&
      feature.properties._data_type &&
      feature.properties._data_type.split('.')[0] == 'equipment' &&
      feature.properties.is_deleted !== 'true' && // deleted planned sites
      !isExistingSiteDeleted(feature.properties.object_id) && // deleted exisiting sites
      Object.keys(clliToEquipmentInfo).length <= MAX_EQUIPMENT_LIST
  }

  const isExistingSiteDeleted = (objectId) => {
    var isDeleted = false
    if (tileDataService.modifiedFeatures.hasOwnProperty(objectId)) {
      const modifiedFeature = tileDataService.modifiedFeatures[objectId]
      if (modifiedFeature.deleted) {
        isDeleted = true
      }
    }
    return isDeleted
  }

  return (
    <div className="equipment-list">
      <table className="table table-sm table-striped">
        <thead>
          <th>Site Clli</th>
          <th>Type</th>
        </thead>
        <tbody>

        </tbody>
      </table>
    </div>
  )
}

const mapStateToProps = (state) => ({
  mapRef: state.map.googleMaps,
  mapLayers: state.mapLayers,
})

const mapDispatchToProps = (dispatch) => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(equipmentDetailList)
