// Class to get UUIDs generated by aro-service.
// DO NOT put any AngularJS or ReactJS specific stuff here.

import fetch from 'cross-fetch'

class UuidStore {
  constructor () {
    this.uuidStore = []
    this.getUUIDsFromServer()
  }

  // Get a list of UUIDs from the server
  getUUIDsFromServer () {
    const numUUIDsToFetch = 20
    fetch(`/service/library/uuids/${numUUIDsToFetch}`)
      .then(response => response.text())
      .then(result => {
        const uuids = JSON.parse(result)
        this.uuidStore = this.uuidStore.concat(uuids)
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
      throw new Error('ERROR: No UUIDs in store')
    }
    return this.uuidStore.pop()
  }
}

const uuidStore = new UuidStore()

export default uuidStore // Note we are exporting the instance