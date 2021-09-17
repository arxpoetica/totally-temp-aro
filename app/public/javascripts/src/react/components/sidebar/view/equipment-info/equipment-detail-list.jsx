import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import MapUtilities from '../../../../../components/common/plan/map-utilities'
import TileDataService from '../../../../../components/tiles/tile-data-service'
import RoicReportsActions from '../../../sidebar/analysis/roic-reports/roic-reports-actions'
import { viewModePanels } from '../../constants'

const tileDataService = new TileDataService()
const MAX_EQUIPMENT_LIST = 100

export const equipmentDetailList = (props) => {

  const [state, setState] = useState({
    clliToEquipmentInfo: {},
  })

  const { clliToEquipmentInfo } = state
  const { mapRef, mapLayers, networkNodeTypesEntity, loadNetworkNodeTypesEntity, onClickObject,
    activeViewModePanel } = props

  useEffect(() => {
    getVisibleEquipmentIds()
    loadNetworkNodeTypesEntity()
    addMapListeners()

    return () => {
      removeMapListeners()
    }
  }, [])

  useEffect(() => {
    mapLayers && refreshEquipmentList()
  }, [mapLayers])

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
    var mapLayersObjKeys = Object.keys(mapLayers)

    mapLayersObjKeys.forEach((mapLayerKey, index) => {
      var mapLayer = mapLayers[mapLayerKey]
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
              const clliToEquipmentInfoObj = {}
              clliToEquipmentInfoObj[feature.properties.object_id] = feature.properties
              setState((state) => ({ ...state, clliToEquipmentInfo: clliToEquipmentInfoObj }))
            }
          }
        })
      })
  }

  const filterFeature = (feature) => {
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

  const refreshEquipmentList = () => {
    // refresh only in equipment list view
    if (activeViewModePanel === viewModePanels.EQUIPMENT_INFO) {
      setState((state) => ({ ...state, clliToEquipmentInfo: {} }))
      setTimeout(() => getVisibleEquipmentIds(), 500)
    }
  }

  const addMapListeners = () => {
    if (mapRef) {
      mapRef.addListener('dragend', () => refreshEquipmentList())
    }
  }

  const removeMapListeners = () => {
    google.maps.event.clearListeners(mapRef, 'dragend')
  }

  return (
    <div className="equipment-list">
      <table className="table table-sm table-striped">
        <thead>
          <tr>
            <th>Site Clli</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.entries(clliToEquipmentInfo).map(([categoryType, equipmentInfo], index) => (
              <tr style={{cursor: 'pointer'}} key={index} 
                onClick={() => onClickObject(equipmentInfo, false)}
              >
                <td>{equipmentInfo.siteClli}</td>
                <td>{networkNodeTypesEntity[equipmentInfo._data_type.split('.')[1]]}</td>
              </tr>
            ))
          }
          {
            Object.keys(clliToEquipmentInfo).length >= MAX_EQUIPMENT_LIST &&
            <tr>
              <td colSpan="2">List limited to {MAX_EQUIPMENT_LIST} sites</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  )
}

const mapStateToProps = (state) => ({
  mapRef: state.map.googleMaps,
  mapLayers: state.mapLayers.activeMapLayers,
  networkNodeTypesEntity: state.roicReports.networkNodeTypesEntity,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
})

const mapDispatchToProps = (dispatch) => ({
  loadNetworkNodeTypesEntity: () => dispatch(RoicReportsActions.loadNetworkNodeTypesEntity()),
})

export default connect(mapStateToProps, mapDispatchToProps)(equipmentDetailList)
