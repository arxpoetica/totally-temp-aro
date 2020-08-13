class MapLayerHelper {
  // Returns RegExes that will tell us which layers can be invalidated based on the modified plan or library ids.
  static getRegexForAllDataIds (mapLayers, planId, libraryId) {
    const dataIds = this._getAllDataIds(mapLayers)
    const dataIdRegexes = dataIds.map(dataId => this._getRegexForDataId(dataId, planId, libraryId))
    return dataIdRegexes
  }

  static _getRegexForDataId (dataId, planId, libraryId) {
    // dataIds are of the form 'v1.plan.{rootPlanId}.tiles.summary.{networkNodeType}.point.{pointTransform}'
    // We want to transform it to a regex that will match all dataids. So in the example above, it should match
    // all values of {networkNodeType}. IF a planId is specified, it should match only that plan. If not specified,
    // then it should match all values of planId. Similar logic for libraryId.
    // Sample regex for above example '^v1\.plan\.569\.tiles\.summary\.(.*)\.point\.(.*)$'

    const planSubstitution = planId || '(.*)'
    const librarySubstitution = libraryId || '(.*)'
    const dataIdComponents = dataId
      .split('.')
      .map(dataIdComponent => {
        if (dataIdComponent === '${planId}' || dataIdComponent === '${rootPlanId}' ||
          dataIdComponent === '{planId}' || dataIdComponent === '{rootPlanId}') {
          return planSubstitution
        } else if (dataIdComponent === '${libraryId}' || dataIdComponent === '{libraryId}') {
          return librarySubstitution
        } else if (dataIdComponent.match(/^(\${).*}$/g) || dataIdComponent.match(/^(\{).*}$/g)) {
          // dataIdComponent is of the form '${xxxxx}' or '{xxxxx}'
          return '(.*)'
        } else {
          return dataIdComponent
        }
      })
    return '^' + dataIdComponents.join('\\.') + '$'
  }

  static _getAllDataIds (mapLayers) {
    var dataIds = new Set()

    // Get location data ids
    mapLayers.location.forEach(locationLayer => {
      locationLayer.tileDefinitions.forEach(tileDefinition => dataIds.add(tileDefinition.dataId))
    })

    // Get data ids for network equipment, cables, roads, etc
    const networkTileDefs = mapLayers.networkEquipment.tileDefinitions
    dataIds.add(networkTileDefs.boundaries.existing.dataId)
    dataIds.add(networkTileDefs.boundaries.planned.dataId)
    dataIds.add(networkTileDefs.cable.existing.dataId)
    dataIds.add(networkTileDefs.cable.planned.dataId)
    if (networkTileDefs.conduit) dataIds.add(networkTileDefs.conduit.dataId)
    dataIds.add(networkTileDefs.equipment.existing.dataId)
    dataIds.add(networkTileDefs.equipment.planned.dataId)
    if (networkTileDefs.road) dataIds.add(networkTileDefs.road.dataId)

    return [...dataIds]
  }
}

export default MapLayerHelper
