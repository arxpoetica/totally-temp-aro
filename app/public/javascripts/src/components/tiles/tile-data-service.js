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
      var tileUrl = `https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/${zoom}/${x}/${y}.vector.pbf?access_token=pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg`

      return new Promise((resolve, reject) => {
        $http.get(tileUrl)
          .then((response) => {
            console.log(response)
            
          })
      })
    }
  }

  tileDataService.clearCache = () => {
    tileDataService.tileCache = {}
  }

  return tileDataService
}])
