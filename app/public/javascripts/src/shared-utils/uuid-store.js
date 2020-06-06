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
}

const uuidStore = new UuidStore()

export default uuidStore // Note we are exporting the instance
