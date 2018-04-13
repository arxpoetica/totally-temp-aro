class EquipmentProperties {
  constructor(siteIdentifier, siteName, selectedSiteType, deploymentDate, selectedEquipmentType) {
    this.siteIdentifier = siteIdentifier || ''
    this.siteName = siteName || ''
    this.siteTypes = ['Remote Terminal']
    this.selectedSiteType = selectedSiteType || this.siteTypes[0]
    this.deploymentDate = deploymentDate || '04/18'
    this.equipmentTypes = [
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
