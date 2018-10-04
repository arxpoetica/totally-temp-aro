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
}

export default TileUtilities