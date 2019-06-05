// Browserify includes
import TileUtilities from './tile-utilities'
import PointInPolygon from 'point-in-polygon'

class FeatureSelector {
  // Loops through all features in this tile and selects the ones that match a comparator function
  static selectFeatures (tileDataService, tileSize, mapLayers, tileZoom, tileX, tileY, shouldFeatureBeSelected, selectedBoundaryLayerId) {
    // Build an array of promises that gets all map layer features (for the layers marked as selectable)
    var promises = []
    Object.keys(mapLayers).forEach((mapLayerKey) => {
      var mapLayer = mapLayers[mapLayerKey]
      if (mapLayer.selectable) {
        const numNeighbors = 1
        for (var deltaX = -numNeighbors; deltaX <= numNeighbors; ++deltaX) {
          for (var deltaY = -numNeighbors; deltaY <= numNeighbors; ++deltaY) {
            var res = Promise.all([
              Promise.resolve({ deltaX: deltaX, deltaY: deltaY }),
              tileDataService.getTileData(mapLayer, tileZoom, tileX + deltaX, tileY + deltaY)
            ])
            promises.push(res.then((results) => {
              results[1].deltaXPx = results[0].deltaX * tileSize.width
              results[1].deltaYPx = results[0].deltaY * tileSize.height
              results[1].featureFilter = mapLayer.featureFilter
              return Promise.resolve(results[1])
            })
            )
          }
        }
      }
    })

    // Return a promise that resolves when all features have been tested
    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((promiseResults) => {
          var hitFeatures = []

          // Loop through all results
          promiseResults.forEach((result) => {
            var layerToFeatures = result.layerToFeatures

            // Loop through all layers in this result
            Object.keys(layerToFeatures).forEach((layerKey) => {
              var features = layerToFeatures[layerKey]
              const filteredFeatures = result.featureFilter ? features.filter(result.featureFilter) : features
              for (var iFeature = 0; iFeature < filteredFeatures.length; ++iFeature) {
                var feature = filteredFeatures[iFeature]
                if (shouldFeatureBeSelected(feature, result.icon, result.deltaXPx, result.deltaYPx)) {
                  hitFeatures.push(feature.properties)
                  console.log(feature)
                  console.log(feature.properties)
                  console.log(feature.loadGeometry())
                }
              }
            })
          })
          // We have a list of features that are 'hit', i.e. under the specified point. Return them.
          resolve(hitFeatures)
        })
        .catch((err) => console.error(err))
    })
  }

  // Gets all features that are within a given polygon
  static getPointsInPolygon (tileDataService, tileSize, mapLayers, tileZoom, tileX, tileY, polygonCoords, selectedBoundaryLayerId) {
    // Define a function that will return true if a given feature should be selected
    var shouldFeatureBeSelected = (feature, icon, deltaX, deltaY) => {
      var selectFeature = false
      deltaX = deltaX || 0
      deltaY = deltaY || 0
      var geometry = feature.loadGeometry()
      geometry.forEach((rawShape) => {
        const shape = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawShape)
        if (shape.length === 1) {
          // Only support points for now
          var locationCoords = [shape[0].x + deltaX, shape[0].y + deltaY]
          if (PointInPolygon(locationCoords, polygonCoords)) {
            selectFeature = true
          }
        } else if (feature.properties.gid) {
          const roadGeom = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(feature.loadGeometry()[0])
          for (var i = 0; i < roadGeom.length; i++) {
            if (PointInPolygon([roadGeom[i].x + deltaX, roadGeom[i].y + deltaY], polygonCoords)) {
              selectFeature = true
              break
            }
            // Check the fiber start or end point is with in polygon
            // Skip all middle points and set to last point.
            i += roadGeom.length - 2
          }
        } else if (feature.properties.code) {
          // Check the SA boundary inside the drew polygon
          // This will be uses when draw the polygon with more than one SA. (With touch the SA boundary)
          feature.loadGeometry().forEach(function (rawAreaGeom) {
            const areaGeom = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawAreaGeom)
            areaGeom.forEach(function (eachValue) {
              var eachPoint = []
              eachPoint.push(eachValue.x + deltaX)
              eachPoint.push(eachValue.y + deltaY)

              if (PointInPolygon(eachPoint, polygonCoords)) {
                selectFeature = true
              }
            })
          })

          if (!selectFeature && feature.properties.code) {
            // Check the drew polygon coordinate inside SA boundary
            // This will be uses when draw the polygon with in one SA. (Without touch the SA boundary)
            feature.loadGeometry().forEach(function (rawAreaGeom) {
              const areaGeom = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawAreaGeom)
              var areaPolyCoordinates = []

              areaGeom.forEach(function (eachValue) {
                var eachPoint = []
                eachPoint.push(eachValue.x + deltaX)
                eachPoint.push(eachValue.y + deltaY)
                areaPolyCoordinates.push(eachPoint)
              })
              polygonCoords.some(function (polyCoord) {
                if (PointInPolygon([polyCoord[0], polyCoord[1]], areaPolyCoordinates)) {
                  selectFeature = true
                  return true
                }
              })
            })
          }
        }
      })
      return selectFeature
    }
    return this.selectFeatures(tileDataService, tileSize, mapLayers, tileZoom, tileX, tileY, shouldFeatureBeSelected, selectedBoundaryLayerId)
  }

  static selectPolyline (feature, xWithinTile, yWithinTile, minPointToPolylineDistance, deltaX, deltaY) {
    var rawGeometry = feature.loadGeometry()
    const geometry = rawGeometry.map(shape => TileUtilities.pixelCoordinatesFromScaledTileCoordinates(shape))
    var distance //, distanceTolineX1Y1,distanceTolineX2Y2

    // Ref: http://www.cprogramto.com/c-program-to-find-shortest-distance-between-point-and-line-segment
    var lineX1, lineY1, lineX2, lineY2, pointX, pointY
    deltaX = deltaX || 0
    deltaY = deltaY || 0
    // Some road segments has more points
    for (var i = 0; i < geometry[0].length - 1; i++) {
      lineX1 = deltaX + Object.values(geometry[0])[i].x // X1, Y1 are the first point of that line segment.
      lineY1 = deltaY + Object.values(geometry[0])[i].y

      lineX2 = deltaX + Object.values(geometry[0])[i + 1].x // X2, Y2 are the end point of that line segment
      lineY2 = deltaY + Object.values(geometry[0])[i + 1].y

      pointX = xWithinTile // pointX, pointY are the point of the reference point.
      pointY = yWithinTile

      //distance = findDistanceToSegment(lineX1, lineY1, lineX2, lineY2, pointX, pointY) // calling function to find the shortest distance
      
      // if (distance <= minPointToPolylineDistance) {
      //   return true
      // }

      var point1 = {x:lineX1,y:lineY1}
      var point2 = {x:lineX2,y:lineY2}
      var point = {x:pointX,y:pointY}
      var isInside = calcIsInsideThickLineSegment(point1,point2,point,minPointToPolylineDistance)
      if(isInside) {
        return true
      }
    }

    function calcIsInsideThickLineSegment(line1, line2, pnt, lineThickness) {
      var L2 = (((line2.x - line1.x) * (line2.x - line1.x)) + ((line2.y - line1.y) * (line2.y - line1.y)));
      if (L2 == 0) return false;
      var r = (((pnt.x - line1.x) * (line2.x - line1.x)) + ((pnt.y - line1.y) * (line2.y - line1.y))) / L2;
    
      //Assume line thickness is circular
      if (r < 0) {
        //Outside line1
        return findDistanceToPoint(line1.x,line1.y,pnt.x,pnt.y) <= lineThickness;
      } else if ((0 <= r) && (r <= 1)) {
        //On the line segment
        var s = (((line1.y - pnt.y) * (line2.x - line1.x)) - ((line1.x - pnt.x) * (line2.y - line1.y))) / L2;
        return (Math.abs(s) * Math.sqrt(L2) <= lineThickness);
      } else {
        //Outside line2
        return findDistanceToPoint(line2.x,line2.y,pnt.x,pnt.y) <= lineThickness;
      }
    }

    function findDistanceToPoint (x1, y1, pointX, pointY) {
      return Math.sqrt((Math.pow((pointX - x1), 2)) + (Math.pow((pointY - y1), 2)))
    }

    function findDistanceToSegment (x1, y1, x2, y2, pointX, pointY) {
      var diffX = x2 - x1
      var diffY = y2 - y1
      if ((diffX == 0) && (diffY == 0)) {
        diffX = pointX - x1
        diffY = pointY - y1
        return Math.sqrt(diffX * diffX + diffY * diffY)
      }

      var t = ((pointX - x1) * diffX + (pointY - y1) * diffY) / (diffX * diffX + diffY * diffY)

      if (t < 0) {
        // point is nearest to the first point i.e x1 and y1
        diffX = pointX - x1
        diffY = pointY - y1
      } else if (t > 1) {
        // point is nearest to the end point i.e x2 and y2
        diffX = pointX - x2
        diffY = pointY - y2
      } else {
        // if perpendicular line intersect the line segment.
        diffX = pointX - (x1 + t * diffX)
        diffY = pointY - (y1 + t * diffY)
      }

      // returning shortest distance
      return Math.sqrt(diffX * diffX + diffY * diffY)
    }
  }

  // Perform hit detection on features and get the first one (if any) under the mouse
  static performHitDetection (tileDataService, tileSize, mapLayers, tileZoom, tileX, tileY, xWithinTile, yWithinTile, selectedBoundaryLayerId) {
    var minimumPointToRoadDistance = 10
    var minimumPointToFiberDistance = 20
    // Define a function that will return true if a given feature should be selected
    var shouldFeatureBeSelected = (feature, icon, deltaX, deltaY) => {
      var selectFeature = false
      var imageWidthBy2 = icon ? icon.width / 2 : 0
      var imageHeightBy2 = icon ? icon.height / 2 : 0
      var geometry = feature.loadGeometry()
      // Geometry is an array of shapes
      deltaX = deltaX || 0
      deltaY = deltaY || 0
      geometry.forEach((rawShape) => {
        // Shape is an array of coordinates
        const shape = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawShape)
        if (shape.length === 1) {
          if (xWithinTile >= shape[0].x + deltaX - imageWidthBy2 &&
              xWithinTile <= shape[0].x + deltaX + imageWidthBy2 &&
              // && yWithinTile >= shape[0].y + deltaY - imageHeightBy2 // for location in center of icon
              // && yWithinTile <= shape[0].y + deltaY + imageHeightBy2
              yWithinTile >= shape[0].y + deltaY - icon.height && // for location at bottom center of icon
              yWithinTile <= shape[0].y + deltaY
          ) {
            // The clicked point is inside the bounding box of the features icon
            selectFeature = true
          }
        }
      })

      // Select Roadsegments
      if (feature.properties.gid) {
        selectFeature = this.selectPolyline(feature, xWithinTile, yWithinTile, minimumPointToRoadDistance, deltaX, deltaY)
      }

      // Select Existing/planned fiber
      // Don't allow FDH equipment which is not a fiber
      if (feature.properties._data_type.indexOf('fiber') > -1 && feature.properties._data_type.indexOf('equipment.') < 0) {
        selectFeature = this.selectPolyline(feature, xWithinTile, yWithinTile, minimumPointToFiberDistance, deltaX, deltaY)
      }

      // Load the selected service area
      // if(feature.properties.code) { // ToDo: use featureType when implimented
    	if (feature.properties.id) {
        // Only select boundary features if the current boundary type is selected
        var shouldTestFeature = true
        if (feature.properties._data_type === 'equipment_boundary.select' && feature.properties.boundary_type) {
          shouldTestFeature = feature.properties.boundary_type === selectedBoundaryLayerId
        }

        if (shouldTestFeature) {
          feature.loadGeometry().forEach(function (rawAreaGeom) {
            const areaGeom = TileUtilities.pixelCoordinatesFromScaledTileCoordinates(rawAreaGeom)
            var areaPolyCoordinates = []

            areaGeom.forEach(function (eachValue) {
              var eachPoint = []
              eachPoint.push(eachValue.x + deltaX)
              eachPoint.push(eachValue.y + deltaY)
              areaPolyCoordinates.push(eachPoint)
            })

            if (PointInPolygon([xWithinTile, yWithinTile], areaPolyCoordinates)) {
              selectFeature = true
            }
          })
        }
      }

      return selectFeature
    }
    return this.selectFeatures(tileDataService, tileSize, mapLayers, tileZoom, tileX, tileY, shouldFeatureBeSelected, selectedBoundaryLayerId)
  }
}

export default FeatureSelector
