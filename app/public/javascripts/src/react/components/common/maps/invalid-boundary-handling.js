import gpsi from 'geojson-polygon-self-intersections'
import WktUtils from '../../../../shared-utils/wkt-utils'
import Utilities from '../../../../components/common/utilities'

export class InvalidBoundaryHandling {
  constructor() {
    this.stashedMapObjects = {};
  }

  stashMapObject(id, mapObject) {
    console.log(this.stashedMapObjects)
    this.stashedMapObjects[id] = WktUtils.getWKTPolygonFromGoogleMapPath(
      mapObject.getPath()
    )
    console.log(this.stashedMapObjects)
    console.log('hitting in the stash')
  }

  isValidPolygon (id, newMapObject) {
    const paths = newMapObject.getPath 
      ? WktUtils.getWKTPolygonFromGoogleMapPath(
        newMapObject.getPath()
      )
      : { type: 'Polygon', coordinates: newMapObject.geometry.coordinates[0] }

    const selfIntersectingPoints = gpsi(
      { type: 'Feature', geometry: paths },
      function filterFn (unique) { return [unique] },
      { useSpatialIndex: false }
    )
    
    if (selfIntersectingPoints.length && newMapObject.getPath) {
      newMapObject.setMap(null)
      console.log("Hitting in the failed")
      newMapObject.setPath(WktUtils.getGoogleMapPathsFromWKTPolygon(this.stashedMapObjects[id]))
      Utilities.displayErrorMessage({
        title: 'Invalid Polygon',
        text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.'
      })
    } else {
      console.log("Hitting in the validation")
      this.stashMapObject(id, newMapObject)
    }

    return [selfIntersectingPoints.length === 0, newMapObject]
  }
}