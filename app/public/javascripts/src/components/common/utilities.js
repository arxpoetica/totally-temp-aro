class Utilities {

  constructor($document, $http){
    this.$document = $document
    this.$http = $http
    this.uuidStore = []
    this.getUUIDsFromServer()
  }

  downloadCSV(data, fileName) {
    // Blob is not supported in older browsers, but we need it for downloading larger files in Chrome.
    // Without this, we get a generic "Failed - network error" in Chrome only.
    let a = this.$document[0].createElement('a');
    this.$document[0].body.appendChild(a);
    var file = new Blob([data], {type: 'text/csv'});
    var fileURL = window.URL.createObjectURL(file);
    a.href = fileURL;
    a.download = fileName;
    a.click();
    this.$document[0].body.removeChild(a);
  }

  blinkMarker(){
    setTimeout( function(){
      var blink = this.document.createElement( 'div' );
      blink.className = 'blink';
      this.document.querySelector('#map-canvas').appendChild( blink );
      setTimeout( function(){
        blink.remove();
      }, 5000 );
    }, 1000 );
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
  getInsecureV4UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

Utilities.$inject =['$document', '$http'];

export default Utilities