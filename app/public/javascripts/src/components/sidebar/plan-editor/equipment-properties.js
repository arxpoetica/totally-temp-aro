class EquipmentProperties {
  constructor (siteIdentifier, siteName, siteNetworkNodeType, selectedEquipmentType, networkNodeEquipment, deploymentType, targetType, locationIDs) {
    this.siteIdentifier = siteIdentifier || ''
    this.siteName = siteName || ''
    this.siteNetworkNodeType = siteNetworkNodeType
    this.equipmentTypes = [
      'Generic ADSL',
      'Generic ADSL2+ DSLAM',
      'Generic ADSL2+ P DSLAM',
      'Generic ADSL-B DSLAM',
      'Generic ADSL DSLAM',
      'Generic VDSL-B DSLAM',
      'Generic VDSL DSLAM'
    ]
    this.selectedEquipmentType = selectedEquipmentType || this.equipmentTypes[0]
    this.networkNodeEquipment = networkNodeEquipment || null
    this.deploymentType = deploymentType || 'PLANNED'
    this.isDirty = false
    this.targetType = targetType
    this.connectedLocations = {}
    if (locationIDs) {
      var ids = locationIDs.split(',')
      ids.forEach(id => {
        this.connectedLocations[id] = true
      })
    }
  }
}

export default EquipmentProperties
