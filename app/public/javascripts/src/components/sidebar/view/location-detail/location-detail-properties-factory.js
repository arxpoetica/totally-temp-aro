class LocationDetailPropertiesFactory {

  constructor($http, configuration) {
    this.$http = $http
    this.configuration = configuration
  }

  createObject(objectDescriptor, properties, outLocationDetailProperties) {
    // First create an object to describe all the properties
    var displayProperties = []
    Object.keys(objectDescriptor).forEach((categoryKey) => {
      const category = objectDescriptor[categoryKey]
      var categoryDisplayProperties = angular.copy(category.displayProperties)
      categoryDisplayProperties.propertyName = categoryKey
      displayProperties.push(categoryDisplayProperties)
      // Create all the child properties of this object
      outLocationDetailProperties[categoryKey] = {}
      if (category.children) {
        this.createObject(category.children, properties, outLocationDetailProperties[categoryKey])
      } else {
        // No child objects, so just create a property for itself
        if (category.type === 'locationKey') {
          outLocationDetailProperties[categoryKey] = properties[categoryKey]
        } else if (category.type === 'attributeKey') {
          outLocationDetailProperties[categoryKey] = properties.attributes.filter((item) => item.key === categoryKey)[0].value
        }
      }
      outLocationDetailProperties.getDisplayProperties = () => displayProperties
    })

  }

  getLocationDetailPropertiesFor(locationDetails) {
    var locationDetailProperties = {}
    this.createObject(this.configuration.locationDetailProperties, locationDetails, locationDetailProperties)
    return locationDetailProperties
  }
}

LocationDetailPropertiesFactory.$inject = ['$http', 'configuration']

export default LocationDetailPropertiesFactory
