class TileUtilities {

  static getTileId(zoom, tileX, tileY) {
    return `${zoom}-${tileX}-${tileY}`
  }

  static getOrderedKeys(obj, orderPram, defaultVal){
    let orderedArr = Object.keys(obj)
    orderedArr.sort(function (a, b) {
	  let aObj = obj[a]
	  let bObj = obj[b]
	    
	  if ( !aObj.hasOwnProperty(orderPram) || isNaN(aObj[orderPram]) ){ aObj[orderPram] = defaultVal }
	  if ( !bObj.hasOwnProperty(orderPram) || isNaN(bObj[orderPram]) ){ bObj[orderPram] = defaultVal }
	  
      return aObj[orderPram] - bObj[orderPram];
    });
    
    return orderedArr;
  }

  static getFiberStrandSize(type,strandSize, minWidth, maxWidth, exponent, atomicDivisor) {
    var width = 0

    switch (type) {
      case "fiber_strands": width = Math.min(Math.pow(strandSize, (exponent)), maxWidth)
        break;
      case "atomic_units": width = Math.min(Math.pow((strandSize / atomicDivisor + 1), (exponent)), maxWidth)
        break;
    }

    var size = (width / maxWidth) * (maxWidth - minWidth) + minWidth - 1
    return Math.max(size,minWidth);
  }

  static isValidLatLong(lat, lng) {
    if(!lat || !lng) return false
    var latLng = lat + ',' + lng
    var matches = latLng.match(/[+-]?([0-9]*[.])?[0-9]+.[\s,]+[+-]?([0-9]*[.])?[0-9]+/)
    if (lat > -90 && lat < 90 && lng > -180 && lng < 180) {
      return true
    } else {
      return false
    }
  }

  static pixelCoordinatesFromScaledTileCoordinates(rawTileCoordinates) {
    // rawTileCoordinates is an array of coordinates. Aro-service is scaling the coordinates, we
    // have to scale them back to convert them to pixels
    const TILE_COORDINATE_SCALING_FACTOR = 1.0 / 16
    return rawTileCoordinates.map(item => ({
      x: item.x * TILE_COORDINATE_SCALING_FACTOR,
      y: item.y * TILE_COORDINATE_SCALING_FACTOR
    }))
  }
}

export default TileUtilities