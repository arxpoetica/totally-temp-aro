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

/*
this will be a proper class keeping state and functions together

there will be a global cache object that will store caches as such
tileCache: {
  unbounded: { // view mode / classic VTS
    ${serviceAreaId}: imageCache,
  }
  bounded: { // plan edit / subnets
    ${subnetId}: imageCache
  }
}

there will be a tile cache culling mechanism that will accept multiple lists and a limit
upon adding an element to any of the lists the culling mechanism will check size and limit and cull if needed
it will cull the oldest elements
it keeps track of age with a linked list
also when a tile comes back on screen it goes back to the end of the line (becoming "young" again) 

We'll probably do two culling objects one for the unbounded set and one for all of the subnets

*/
