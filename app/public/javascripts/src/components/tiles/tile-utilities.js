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
}

export default TileUtilities