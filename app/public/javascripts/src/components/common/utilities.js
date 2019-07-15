import { MenuItemTypes } from '../common/context-menu/menu-item'

class Utilities {
  constructor ($document, $http) {
    this.$document = $document
    this.$http = $http
    this.uuidStore = []
    this.getUUIDsFromServer()
  }

  static displayErrorMessage (errorMsg) {
    swal({ title: errorMsg.title, text: errorMsg.text, type: 'error' })
  }

  downloadFile (data, fileName) {
    // Blob is not supported in older browsers, but we need it for downloading larger files in Chrome.
    // Without this, we get a generic "Failed - network error" in Chrome only.
    let a = this.$document[0].createElement('a')
    this.$document[0].body.appendChild(a)
    var file = new Blob([data])
    var fileURL = window.URL.createObjectURL(file)
    a.href = fileURL
    a.download = fileName
    a.click()
    this.$document[0].body.removeChild(a)
  }

  // Get a list of UUIDs from the server
  getUUIDsFromServer () {
    const numUUIDsToFetch = 20
    this.$http.get(`/service/library/uuids/${numUUIDsToFetch}`)
      .then((result) => {
        this.uuidStore = this.uuidStore.concat(result.data)
      })
      .catch((err) => console.error(err))
  }
  // Get a UUID from the store
  getUUID () {
    if (this.uuidStore.length < 7) {
      // We are running low on UUIDs. Get some new ones from aro-this while returning one of the ones that we have
      this.getUUIDsFromServer()
    }
    if (this.uuidStore.length === 0) {
      throw 'ERROR: No UUIDs in store'
    }
    return this.uuidStore.pop()
  }

  // Generate CRYPTOGRAPHICALLY INSECURE v4 UUIDs. These are fine for use as (for example) Google Autocomplete tokens.
  // The advantage is that you do not have to wait for service to return UUIDs before you can initialize the app and
  // the searching controls. Do NOT pass these back to service in any form, and do not use these where security is involved.
  // Code is from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  getInsecureV4UUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; var v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  getObjectSize (object) {
    return Object.keys(object).length
  }

  getFeatureMenuItemType (feature) {
    // Get the components of the data type. Example feature._data_type = 'location', 'equipment'
    const dataTypeComponents = (feature._data_type || feature.dataType || '').split('.')
    const dataType = dataTypeComponents[0]
    // Have a map of data type to menu item types
    const dataTypeToMenuItemType = {
      location: MenuItemTypes.LOCATION,
      equipment: MenuItemTypes.EQUIPMENT,
      equipment_boundary: MenuItemTypes.BOUNDARY,
      service_layer: MenuItemTypes.SERVICE_AREA,
      census: MenuItemTypes.CENSUS
    }
    return dataTypeToMenuItemType[dataType]
  }

  // ToDo: combine display name and CLLIs
  getFeatureDisplayName (feature, state) {
    // Get the components of the data type. Example feature._data_type = 'location', 'equipment'
    const dataTypeComponents = (feature._data_type || feature.dataType || '').split('.')
    const dataType = dataTypeComponents[0]
    // Have a map of functions that will extract feature names based on the feature type
    const dataTypeToNameExtractor = {
      location: feature => feature.name || (feature.objectId && feature.objectId.substring(feature.objectId.length - 7)) || 'Location',
      equipment_boundary: feature => 'Boundary',
      equipment: feature => {
        const nnType = (feature['_data_type']).split('.')[1]
        var name = nnType
        if (state.configuration.networkEquipment.equipments[nnType]) {
          name = state.configuration.networkEquipment.equipments[nnType].label
        } else if (state.networkNodeTypesEntity[nnType]) {
          name = state.networkNodeTypesEntity[nnType]
        }
        if (feature.siteClli) {
          name += `: ${feature.siteClli}`
        }
        return name
      },
      service_layer: feature => feature.code || feature.siteClli || 'Unnamed service area'
    }

    const defaultNameExtractor = () => {
      return dataTypeComponents[1].split('_').join(' ').replace(/\b\w/g, function (l) { return l.toUpperCase() })
    }
    const extractor = dataTypeToNameExtractor[dataType] || defaultNameExtractor
    return extractor(feature)
  }

  getBoundsCLLIs (features, state) {
    var cllisByObjectId = {}
    var doCall = false
    var filter = `planId eq ${state.plan.id} and (`
    features.forEach((feature) => {
      filter += `objectId eq guid'${feature.network_node_object_id}' or `
      doCall = true
    })

    if (doCall) {
      filter = filter.substring(0, filter.length - 4) + ')'
      return this.$http.get(`/service/odata/NetworkEquipmentEntity?$select=id,objectId,clli&$filter=${filter}`)
    } else {
      return Promise.resolve({ 'data': [] })
    }
  }

  // ---
}

Utilities.$inject = ['$document', '$http']

export default Utilities
