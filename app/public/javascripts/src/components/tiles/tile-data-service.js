app.service('tileData', ['$http', ($http) => {

  var tileDataService = {}
  tileDataService.tileDataCache = {}

  tileDataService.getTileCacheKey = (zoom, x, y, layerId) => {
    return `${zoom}-${x}-${y}-${layerId}`
  }

  tileDataService.getTileData = (zoom, x, y, layerId) => {
    var tileCacheKey = tileDataService.getTileCacheKey(zoom, x, y, layerId)
    if (tileDataService.tileDataCache[tileCacheKey]) {
      // Tile data exists in cache
      return Promise.resolve(tileDataService[tileCacheKey])
    } else {
      // Tile data does not exist in cache. Get it from a server
      var tileUrl = `/tile/${zoom}/${x}/${y}/${layerId}?aggregate=true`

      return new Promise((resolve, reject) => {
        $http.get(tileUrl)
          .then((response) => {
            if (reponse.status >= 200 && response.status <= 299) {
              tileDataService.tileDataCache[tileCacheKey] = response.data
              resolve(tileDataService.tileDataCache[tileCacheKey])
            } else {
              reject(response)
            }
          })
      })
    }
  }

  tileDataService.clearCache = () => {
    tileDataService.tileCache = {}
  }

  return tileDataService
}])
