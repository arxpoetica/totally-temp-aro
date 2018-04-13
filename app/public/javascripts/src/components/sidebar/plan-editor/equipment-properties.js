class EquipmentProperties {
  constructor(siteIdentifier, siteName, siteNetworkNodeType, selectedEquipmentType) {
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
    this.isDirty = false
  }
}

export default EquipmentProperties
