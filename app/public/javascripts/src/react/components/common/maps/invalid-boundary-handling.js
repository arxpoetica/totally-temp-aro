import gpsi from 'geojson-polygon-self-intersections'
import WktUtils from '../../../../shared-utils/wkt-utils'
import Utilities from '../../../../components/common/utilities'

export class InvalidBoundaryHandling {
  constructor() {
    this.stashedMapObjects = {};
  }

  stashMapObject(id, mapObject) {
    this.stashedMapObjects[id] = WktUtils.getWKTPolygonFromGoogleMapPath(
      mapObject.getPath()
    )
  }

  isValidPolygon (id, newMapObject) {
    const paths = WktUtils.getWKTPolygonFromGoogleMapPath(
      newMapObject.getPath()
    )

    const selfIntersectingPoints = gpsi(
      { type: 'Feature', geometry: paths },
      function filterFn (unique) { return [unique] },
      { useSpatialIndex: false }
    )
    
    if (selfIntersectingPoints.length) {
      console.log("INVALID BOUNDARY")
      newMapObject.setMap(null)
      newMapObject.feature.geometry =  this.stashedMapObjects[id]
      Utilities.displayErrorMessage({
        title: 'Invalid Polygon',
        text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.'
      })
    } else {
      console.log("VALID BOUNDARY")
    }

    return [selfIntersectingPoints.length === 0, newMapObject]
  }
}