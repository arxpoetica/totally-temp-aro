class CommandDeleteLocation {
  execute(store, params) {

    // Every feature creation is immediately pushed to the server. Even if this is a newly created
    // feature, it will have been pushed to the server.

    // If this is a created marker, remove it from the map
    if (store.createdMarkers[params.uuid]) {
      store.createdMarkers[params.uuid].setMap(null)
      delete store.createdMarkers[params.uuid]
    }

    // Save the feature object deletion to aro-service
    params.$http.delete(`/service/library/transaction/${params.transactionId}/features/${params.uuid}`)

    this.params = params
  }
}

export default CommandDeleteLocation