class CommandEditLocation {
  execute(store, params) {
    // Update the feature object in the store
    var featureObj = store.uuidToFeatures[params.marker.uuid]
    featureObj.attributes.number_of_households = params.numLocations

    // Save the feature object to aro-service
    params.$http.post(`/service/library/transaction/${params.transactionId}/features`, featureObj)

    this.params = params
  }
}

export default CommandEditLocation