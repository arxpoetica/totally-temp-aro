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
      if (newMapObject.feature) {
        newMapObject.feature.geometry =  this.stashedMapObjects[id]
      }
      Utilities.displayErrorMessage({
        title: 'Invalid Polygon',
        text: 'Polygon shape is invalid, please try again. Ensure that the polygon is not self-intersecting.'
      })
    }

    return [selfIntersectingPoints.length === 0, newMapObject]
  }
}