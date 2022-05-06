let tileCache = {}
// [z][x][y]
// image cache will probably keep it's own setters and getters for limit reasons
function deleteCachedImages (tileIds) {
  tileIds.forEach(tileId => {
    if (
      tileCache[tileId.z]
      && tileCache[tileId.z][tileId.x]
      && tileCache[tileId.z][tileId.x][tileId.y]
    ) {
      delete tileCache[tileId.z][tileId.x][tileId.y]
      if (!Object.keys(tileCache[tileId.z][tileId.x]).length) {
        delete tileCache[tileId.z][tileId.x]
        if (!Object.keys(tileCache[tileId.z]).length) {
          delete tileCache[tileId.z]
        }
      }
    }
  })
}
