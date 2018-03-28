import TransactionStore from './transactionStore'
import CommandAddLocation from './commandAddLocation'
import CommandMoveLocation from './commandMoveLocation'
import CommandEditLocation from './commandEditLocation'
import CommandDeleteLocation from './commandDeleteLocation'

class LocationEditorController2 {
}

// class LocationEditorController {

//   constructor($http, $timeout, state, tileDataService) {
//     this.$http = $http
//     this.$timeout = $timeout
//     this.state = state
//     this.tileDataService = tileDataService
//     this.addLocationData = {
//       types: [
//         'Household'
//       ],
//       selectedType: 'Household',
//       numLocations: 1
//     }

//     this.currentTransaction = null

//     this.isInErrorState = false
//     this.store = new TransactionStore($http)
//     this.selectedLocation = null
//     this.mapFeaturesSelectedEventObserver = state.mapFeaturesSelectedEvent.subscribe((event) => this.handleMapEntitySelected(event))
//   }

//   $onInit() {
//     // We should have a map variable at this point
//     if (!window[this.mapGlobalObjectName]) {
//       console.error('ERROR: Location Editor component initialized, but a map object is not available at this time.')
//       return
//     }

//     // We should have exactly one location data source selected. If not, return. The component will
//     // show an error message and cannot be interacted with.
//     if (this.state.dataItems.location && this.state.dataItems.location.selectedLibraryItems.length !== 1) {
//       this.isInErrorState = true
//       return
//     }

//     this.mapRef = window[this.mapGlobalObjectName]
//     this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.CREATE

//     // Handler for map click - this is when we create a new location
//     var self = this
//     this.clickListener = google.maps.event.addListener(this.mapRef, 'click', function (event) {
//       if (self.state.selectedTargetSelectionMode !== self.state.targetSelectionModes.CREATE) {
//         return
//       }
//       self.createEditableMarker(event.latLng, null, null)
//     });

//     // See if we have an existing transaction for the currently selected location library
//     var selectedLibraryItem = this.state.dataItems.location.selectedLibraryItems[0]
//     this.$http.get(`/service/library/transaction?user_id=${this.state.getUserId()}`)
//       .then((result) => {
//         var existingTransactions = result.data.filter((item) => item.libraryId === selectedLibraryItem.identifier)
//         if (existingTransactions.length > 0) {
//           // We have an existing transaction for this library item. Use it.
//           return Promise.resolve({ data: existingTransactions[0] })
//         } else {
//           return this.$http.post('/service/library/transaction', {
//             libraryId: selectedLibraryItem.identifier,
//             userId: this.state.getUserId()
//           })
//         }
//       })
//       .then((result) => {
//         this.currentTransaction = result.data
//         return this.$http.get(`/service/library/transaction/${this.currentTransaction.id}/features`)
//       })
//       .then((result) => {
//         this.store.setFeatures(result.data)
//       })
//       .catch((err) => {
//         console.error(err)
//         this.isInErrorState = true
//         this.$timeout()
//       })
//   }

//   handleMapEntitySelected(event) {
//     if (!(this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.MOVE
//       || this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE)
//       || this.state.activeViewModePanel !== this.state.viewModePanels.EDIT_LOCATIONS) {
//       return  // Currently only supporting editing of single entities
//     }
//     if (!event.latLng || !event.locations || event.locations.length === 0) {
//       return  // Only supporting editing of a single location
//     }

//     var objectId = event.locations[0].object_id

//     if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.MOVE) {
//       this.createEditableMarker(event.latLng, objectId)
//     } else if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE) {
//       var command = new CommandDeleteLocation()
//       var params = {
//         objectId: objectId,
//         $http: this.$http,
//         transactionId: this.currentTransaction.id
//       }
//       this.store.executeCommand(command, params)
//     }

//     // Stop rendering this location in the tile
//     this.tileDataService.addFeatureToExclude(objectId)
//     this.state.requestMapLayerRefresh.next({})
//   }

//   createEditableMarker(coordinateLatLng, objectId) {
//     // Create a new marker for the location, only if we are in the right selection mode
//     var command = new CommandAddLocation()
//     var params = {
//       objectId: objectId,
//       locationLatLng: coordinateLatLng,
//       numLocations: this.addLocationData.numLocations,
//       map: this.mapRef,
//       $http: this.$http,
//       transactionId: this.currentTransaction.id
//     }
//     var newLocationMarker = this.store.executeCommand(command, params)
//     this.selectMarker(newLocationMarker)
//     this.$timeout() // Trigger change detection

//     // Monitor events on the marker for dragstart and dragend
//     newLocationMarker.addListener('dragstart', (event) => {
//       this.handleDragStart(event)
//     })
//     newLocationMarker.addListener('dragend', (event) => {
//       this.handleDragEnd(newLocationMarker, event)
//     })
//     newLocationMarker.addListener('mousedown', (event) => {
//       if (this.state.selectedTargetSelectionMode === this.state.targetSelectionModes.DELETE) {
//         // We are in delete mode.
//         var command = new CommandDeleteLocation()
//         var params = {
//           objectId: newLocationMarker.objectId,
//           $http: this.$http,
//           transactionId: this.currentTransaction.id
//         }
//         this.store.executeCommand(command, params)
//         this.$timeout()
//       } else {
//         // We are not in delete mode. Select the marker
//         this.selectMarker(newLocationMarker)
//       }
//     })
//   }

//   selectMarker(marker) {
//     if (this.selectedLocation) {
//       this.selectedLocation.setIcon('/images/map_icons/aro/households_modified.png')
//     }
//     this.selectedLocation = marker
//     this.selectedLocation.setIcon('/images/map_icons/aro/households_selected.png')
//     var featureObj = this.store.objectIdToFeatures[marker.objectId]
//     this.addLocationData.numLocations = featureObj.numLocations
//     this.$timeout()
//   }

//   handleDragStart(event) {
//     this.dragStartLatLng = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng())
//   }

//   handleDragEnd(marker, event) {
//     var command = new CommandMoveLocation()
//     var params = {
//       marker: marker,
//       oldLocation: this.dragStartLatLng,
//       newLocation: new google.maps.LatLng(event.latLng.lat(), event.latLng.lng()),
//       $http: this.$http,
//       transactionId: this.currentTransaction.id
//     }
//     this.store.executeCommand(command, params)
//     this.dragStartLatLng = null
//     this.$timeout() // Trigger change detection
//   }

//   handleNumLocationsChanged() {
//     if (this.selectedLocation) {
//       var command = new CommandEditLocation()
//       var params = {
//         marker: this.selectedLocation,
//         numLocations: this.addLocationData.numLocations,
//         $http: this.$http,
//         transactionId: this.currentTransaction.id
//       }
//       this.store.executeCommand(command, params)
//     }
//   }

//   commitTransaction() {
//     if (!this.currentTransaction) {
//       console.error('No current transaction. We should never be in this state. Aborting commit...')
//     }

//     // All modifications will already have been saved to the server. Commit the transaction.
//     this.$http.put(`/service/library/transaction/${this.currentTransaction.id}`)
//       .then((result) => {
//         // Committing will close the transaction. To keep modifying, open a new transaction
//         this.currentTransaction = null
//         this.state.recreateTilesAndCache()
//         this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
//         this.$timeout()
//       })
//       .catch((err) => {
//         this.currentTransaction = null
//         this.state.recreateTilesAndCache()
//         this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
//         this.$timeout()
//         console.error(err)
//       })
//   }

//   discardTransaction() {
//     swal({
//       title: 'Delete transaction?',
//       text: `Are you sure you want to delete transaction with ID ${this.currentTransaction.id} for library ${this.currentTransaction.libraryName}`,
//       type: 'warning',
//       confirmButtonColor: '#DD6B55',
//       confirmButtonText: 'Yes, discard',
//       cancelButtonText: 'No',
//       showCancelButton: true,
//       closeOnConfirm: true
//     }, (deleteTransaction) => {
//       if (deleteTransaction) {
//         // The user has confirmed that the transaction should be deleted
//         this.$http.delete(`/service/library/transaction/${this.currentTransaction.id}`)
//           .then((result) => {
//             this.currentTransaction = null
//             this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
//             this.$timeout()
//           })
//           .catch((err) => {
//             this.currentTransaction = null
//             this.state.activeViewModePanel = this.state.viewModePanels.LOCATION_INFO  // Close out this panel
//             this.$timeout()
//           })
//       }
//     })
//   }

//   destroyAllCreatedMarkers() {
//     // Remove all markers that we have created
//     Object.keys(this.store.createdMarkers).forEach((key) => {
//       var marker = this.store.createdMarkers[key]
//       marker.setMap(null)
//     })
//     this.store.createdMarkers = {}
//   }

//   $onDestroy() {

//     this.destroyAllCreatedMarkers()

//     // Reset selection mode to single select mode
//     this.state.selectedTargetSelectionMode = this.state.targetSelectionModes.MOVE

//     // Remove listener
//     google.maps.event.removeListener(this.clickListener)

//     //unsubscribe map click observer
//     this.mapFeaturesSelectedEventObserver.unsubscribe();
//   }
// }

// LocationEditorController.$inject = ['$http', '$timeout', 'state', 'tileDataService']

export default LocationEditorController2