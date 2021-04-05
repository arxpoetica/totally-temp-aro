 // The selected panel when in the View mode
const viewModePanels = Object.freeze({
  LOCATION_INFO: 'LOCATION_INFO',
  EQUIPMENT_INFO: 'EQUIPMENT_INFO',
  BOUNDARIES_INFO: 'BOUNDARIES_INFO',
  ROAD_SEGMENT_INFO: 'ROAD_SEGMENT_INFO',
  PLAN_SUMMARY_REPORTS: 'PLAN_SUMMARY_REPORTS',
  COVERAGE_BOUNDARY: 'COVERAGE_BOUNDARY',
  EDIT_LOCATIONS: 'EDIT_LOCATIONS',
  EDIT_SERVICE_LAYER: 'EDIT_SERVICE_LAYER',
  PLAN_INFO: 'PLAN_INFO'
})

// The display modes for the application
const displayModes = Object.freeze({
  VIEW: 'VIEW',
  ANALYSIS: 'ANALYSIS',
  EDIT_RINGS: 'EDIT_RINGS',
  EDIT_PLAN: 'EDIT_PLAN',
  PLAN_SETTINGS: 'PLAN_SETTINGS',
  DEBUG: 'DEBUG'
})

const entityTypeCons = Object.freeze({
  LOCATION_OBJECT_ENTITY: 'LocationObjectEntity',
  NETWORK_EQUIPMENT_ENTITY: 'NetworkEquipmentEntity',
  SERVICE_AREA_VIEW: 'ServiceAreaView',
  CENSUS_BLOCKS_ENTITY: 'CensusBlocksEntity',
  ANALYSIS_AREA: 'AnalysisArea',
  ANALYSIS_LAYER: 'AnalysisLayer'
})

const boundryTypeCons = Object.freeze({
  CENSUS_BLOCKS: 'census_blocks',
  WIRECENTER: 'wirecenter',
  ANALYSIS_LAYER: 'analysis_layer',
})

const mapHitFeatures = Object.freeze({
  LAT_LNG: 'latLng',
  LOCATIONS: 'locations',
  SERVICE_AREAS: 'serviceAreas',
  ANALYSIS_AREAS: 'analysisAreas',
  ROAD_SEGMENTS: 'roadSegments',
  EQUIPMENT_FEATURES: 'equipmentFeatures',
  CENSUS_FEATURES: 'censusFeatures',
  FIBER_FEATURES: 'fiberFeatures'
})


export {
  viewModePanels,
  displayModes,
  entityTypeCons,
  boundryTypeCons,
  mapHitFeatures
}