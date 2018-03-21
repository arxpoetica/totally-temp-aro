class CommandAddLocation {
  execute(store, params) {

    // Create a new feature object
    var featureObj = {
      objectId: params.uuid ? params.uuid : store.getUUID(),  // Create a new UUID if this is a new object, else reuse it
      geometry: {
        type: 'Point',
        coordinates: [params.locationLatLng.lng(), params.locationLatLng.lat()] // Note - longitude, then latitude
      },
      attributes: {
        number_of_households: params.numLocations
      }
    }
    store.uuidToFeatures[featureObj.uuid] = featureObj

    // Create a new google maps marker
    var newLocationMarker = new google.maps.Marker({
      position: params.locationLatLng,
      icon: '/images/map_icons/aro/households_default.png',
      draggable: true,
      map: params.map,
      uuid: featureObj.uuid
    })
    store.createdMarkers[featureObj.uuid] = newLocationMarker

    // Save the feature object to aro-service
    params.$http.post(`/service/library/transaction/${params.transactionId}/features`, featureObj)

    this.params = params
    return newLocationMarker
  }
}

export default CommandAddLocation