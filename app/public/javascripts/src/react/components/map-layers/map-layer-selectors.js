import { createSelector } from 'reselect'

const getARO_CLIENT = state => state.configuration.system.ARO_CLIENT

const getLocationTypes = state => state.mapLayers.location
const getEquipmentTypes = state => state.mapLayers.networkEquipment.equipments
const getConstructionAreaTypes = state => state.mapLayers.constructionAreas.construction_areas

const getIconsByType = createSelector(
  [getARO_CLIENT, getLocationTypes, getEquipmentTypes, getConstructionAreaTypes],
  (ARO_CLIENT, locationTypes, equipmentTypes, constructionAreaTypes) => {
    let iconsByType = {_alert:{}}
    const alertSuffix = '_alert.png' // we've only made .png but ideally they would match the file type
    
    locationTypes.forEach(location => {
      let iconUrl = location.iconUrl
      iconsByType[location.key] = iconUrl
      let dotP = iconUrl.lastIndexOf('.');
      iconsByType['_alert'][location.key] = iconUrl.substring(0, dotP) + alertSuffix
    })

    let allEqTypes = { ...equipmentTypes, ...constructionAreaTypes}
    Object.keys(allEqTypes).forEach(eqType => {
      let iconUrl = allEqTypes[eqType].iconUrl
      iconsByType[eqType] = iconUrl
      let dotP = iconUrl.lastIndexOf('.');
      let alertIconUrl = iconUrl.substring(0, dotP) + alertSuffix
      alertIconUrl = alertIconUrl.split(`/${ARO_CLIENT}/`).join(`/${ARO_CLIENT}/equipment/`)
      iconsByType['_alert'][eqType] = alertIconUrl
    })
    
    return iconsByType
  }
)

const MapLayerSelectors = Object.freeze({
  getIconsByType,
})

export default MapLayerSelectors
