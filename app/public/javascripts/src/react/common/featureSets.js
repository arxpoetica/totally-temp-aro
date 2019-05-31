
export default class FeatureSets {
  constructor () {
    
    this.latLng = {
      lat:null,
      lng:null
    }
    this.locations = []
    this.serviceAreas = []
    this.analysisAreas = []
    this.roadSegments = new Set()
    this.equipmentFeatures = []
    this.censusFeatures = []
    this.fiberFeatures = new Set()
    
  }
}