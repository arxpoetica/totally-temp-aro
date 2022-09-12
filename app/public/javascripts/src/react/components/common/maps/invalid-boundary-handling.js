import { klona } from "klona"
import gpsi from 'geojson-polygon-self-intersections'
import WktUtils from '../../../../shared-utils/wkt-utils'
import Utilities from '../../../../components/common/utilities'

export class InvalidBoundaryHandling {
  constructor() {
    this.stashedMapObjects = {};
  }

  isValidPolygon (id, newMapObject) {
    const isValid = this.checkIntersection(newMapObject)
    isValid
      ? this.stashMapObject(id, newMapObject)
      : this.handleIntersecting(id, newMapObject)

    return [isValid, newMapObject]
  }

  stashMapObject(id, mapObject) {
    this.stashedMapObjects[id] = klona(WktUtils.getWKTMultiPolygonFromGoogleMapPaths(
      mapObject.getPaths()
    ))
  }

  checkIntersection(newMapObject) {
    const paths = newMapObject.getPaths
    ? WktUtils.getWKTMultiPolygonFromGoogleMapPaths(
        newMapObject.getPaths()
      )
    : { type: 'MultiPolygon', coordinates: newMapObject.geometry.coordinates[0] }
    // GPSI only allows for single polygons, so we loop
    // through all the parts of the multiPolygon until there
    // is an intersecting path in one of them
    let isValid = true;
    for (let i = 0; i < paths.coordinates.length; i++) {
      if (isValid) {
        let selfIntersectingPoints = gpsi(
          { 
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: paths.coordinates[i]
            }
          },
          function filterFn (unique) { return [unique] },
          { useSpatialIndex: false }
        )

        isValid = selfIntersectingPoints.length === 0
      }
    }
    
    return isValid;
  }

  handleIntersecting(id, newMapObject) {
    newMapObject.setMap(null)
    newMapObject.setPaths(WktUtils.getGoogleMapPathsFromWKTMultiPolygon(this.stashedMapObjects[id]))
    Utilities.displayErrorMessage({
      title: 'Invalid Polygon',
      text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.'
    })
  }
}