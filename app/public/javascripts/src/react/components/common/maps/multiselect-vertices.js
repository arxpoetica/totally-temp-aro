export class MultiSelectVertices {
  constructor(mapObject, mapRef, googleUtil, contextMenuClick) {
    this.mapObjectOverlay = [];
    this.mapObject = mapObject;
    this.mapRef = mapRef;
    this.googleUtil = googleUtil;
    this.contextMenuClick = contextMenuClick
  }

  markerIndex(vertex) {
    return this.mapObjectOverlay.findIndex((marker) => {
      return marker.title === `${vertex}`
    })
  }

  addOrRemoveMarker(event) {
    const indexOfMarker = this.markerIndex(event.vertex)

    if (indexOfMarker >= 0) {
      this.removeMarker(indexOfMarker)
    } else {
      this.addMarker(event)
    }
  }

  addMarker(event) {
    const vertex = this.mapObject.getPath().getAt(event.vertex)
    // Position of the marker is oriented on the vertex rather than the event.latLng to ensure
    // the coords are normalized
    const position = new this.googleUtil.maps.LatLng(vertex.lat(), vertex.lng())
    const newMarker = new this.googleUtil.maps.Marker({
      position,
      map: this.mapRef,
      title: `${event.vertex}`,
      icon: {
        path: this.googleUtil.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        fillColor: 'white',
        strokeColor: '#FF69B4',
        strokeOpacity: 1,
        strokeWeight: 3,
        scale: 6,
        // This was added to ensure that the svg was centered on the verte
        // The vertex coords seem to be .1,.1 off center of the vertex icon itself.
        anchor: new this.googleUtil.maps.Point(.1, .1)
      },
      optimized: !ARO_GLOBALS.MABL_TESTING,
    })

    newMarker.addListener('click', (subEvent) => {
      // Added this because once the marker is added sometimes you click the marker and sometimes the vertex
      // So this is a fail safe.
      if (subEvent.domEvent.shiftKey) {
        const indexOfMarker = this.markerIndex(event.vertex)
        this.removeMarker(indexOfMarker)
      }
    })

    newMarker.addListener('contextmenu', subEvent => {
      this.contextMenuClick(subEvent, this.mapObject)
    })

    this.mapObjectOverlay = this.mapObjectOverlay.concat(newMarker)
  }

  removeMarker(indexOfMarker) {
    const mapObjectOverlayClone = [...this.mapObjectOverlay]
    const [removedMarker] = mapObjectOverlayClone.splice(indexOfMarker, 1)
    this.mapObjectOverlay = mapObjectOverlayClone
    removedMarker.setMap(null)
  }

  createsyntheticVertexEvent(marker) {
    return {
      vertex: marker.title,
      latLng: marker.position
    }
  }

  clearMapObjectOverlay() {
    for (const marker of this.mapObjectOverlay) {
      this.googleUtil.maps.event.clearInstanceListeners(marker);
      marker.setMap(null)
    }
    this.mapObjectOverlay = []
  }

  finishDeletion() {
    const sortedObjects = this.mapObjectOverlay.sort((a, b) => {
      return Number(b.title) - Number(a.title)
    })

    const length = this.mapObject.getPath().getLength();
    let nextVertexEvent = this.createsyntheticVertexEvent(sortedObjects[0])
    if (nextVertexEvent.vertex >= length ) nextVertexEvent.vertex -= 1;
    this.clearMapObjectOverlay()

    this.addMarker(nextVertexEvent)
  }
}

