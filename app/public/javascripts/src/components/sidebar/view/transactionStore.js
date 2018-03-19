class TransactionStore {
  constructor($http) {
    this.$http = $http
    this.commandStack = []    // Stack of all commands executed
    this.uuidToFeatures = {}  // Map of feature UUID to feature object
    this.createdMarkers = {}  // All google maps markers created by this component
    this.uuidStore = []       // A list of UUIDs generated from the server
    this.getUUIDsFromServer()
  }

  // Get a list of UUIDs from the server
  getUUIDsFromServer() {
    const numUUIDsToFetch = 20
    this.$http.get(`/service/library/uuids/${numUUIDsToFetch}`)
      .then((result) => {
        this.uuidStore = this.uuidStore.concat(result.data)
      })
      .catch((err) => console.error(err))
  }

  // Get a UUID from the store
  getUUID() {
    if (this.uuidStore.length < 7) {
      // We are running low on UUIDs. Get some new ones from aro-service while returning one of the ones that we have
      this.getUUIDsFromServer()
    }
    return this.uuidStore.pop()
  }

  // Executes a command in the store
  executeCommand(command, params) {
    var result = command.execute(this, params)
    this.commandStack.push(command)
    return result
  }

  // Sets the features that we are currently editing in this transaction. This can come from aro-service for long running transactions.
  setFeatures(features) {
    // Sample feature:
    // {
    //   "objectId": "0936eaca-1dcc-11e8-8aaf-4f5a90ed3b18",
    //   "geometry": {
    //   "type": "Point",
    //   "coordinates": [
    //       -124.664518,
    //       48.153201
    //     ],
    //   },
    //   "attributes": {
    //     "number_of_households": "100"
    //   }
    // }
    this.uuidToFeatures = {}
    features.forEach((feature) => {
      this.uuidToFeatures[feature.objectId] = feature
    })

    this.createdMarkers = {}
  }

  getFeaturesCount() {
    return Object.keys(this.uuidToFeatures).length
  }
}

export default TransactionStore