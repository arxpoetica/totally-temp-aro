import {LinkedListMutator as LLM} from "../../../common/linked-list-mutator"

/*
there will be a global cache object that will store caches as such
tileCache: {
  unbounded: { // view mode / classic VTS
    ${serviceAreaId}: imageCache,
  }
  bounded: { // plan edit / subnets
    ${subnetId}: imageCache
  }
}

eventually there will be a tile cache culling mechanism that will accept multiple lists and a limit
upon adding an element to any of the lists the culling mechanism will check size and limit and cull if needed
it will cull the oldest elements
it keeps track of age with a linked list
also when a tile comes back on screen it goes back to the end of the line (becoming "young" again) 
We'll probably do two culling objects one for the unbounded set and one for all of the subnets
For the moment culling is handled here locally with TileCache itself manipulating the linked list 

*/

export class TileCache {
  constructor (itemLimit) {
    this.itemLimit = itemLimit
    this.#reset()
  }

// --- private --- //

  #reset () {
    this.#tileCache = {} // [z][x][y]
    // ToDo: in the future, the culling mechanism should be a seperate class 
    //  that encompasses multiple caches. 
    //  Such that adding a tile to one cache can cause a cull on a different, older cache  
    this.#cullItems = LLM.getNewLinkedList() // head is new, tail is old
  }

  #tileIdToCacheId (tileId) {
    return `${tileId.z}_${tileId.x}_${tileId.y}`
  }

  #checkCull () {
    let cullCount = LLM.getCount(this.#cullItems)
    cullCount -= this.itemLimit
    if (0 < cullCount) {
      for (let i=0; i<cullCount; i++) {
        let tailTileId = LLM.getTail(this.#cullItems).value
        this.#deleteTile(tailTileId)
        this.#cullItems = LLM.removeTail(this.#cullItems)
      }
    }
  }

  // private, removes tile element ONLY
  //  the caller should also call tileCull.removeElement UNLESS the caller is tileCull 
  #deleteTile (tileId) {
    delete this.#tileCache[tileId.z][tileId.x][tileId.y]
    if (!Object.keys(this.#tileCache[tileId.z][tileId.x]).length) {
      delete this.#tileCache[tileId.z][tileId.x]
      if (!Object.keys(this.#tileCache[tileId.z]).length) {
        delete this.#tileCache[tileId.z]
      }
    }
  }

// --- public --- //

  doesExist (tileId) {
    if (
      this.#tileCache[tileId.z]
      && this.#tileCache[tileId.z][tileId.x]
      && this.#tileCache[tileId.z][tileId.x][tileId.y]
    ) {
      return true
    }
    return false
  }

  // image cache will probably keep it's own setters and getters for limit reasons
  deleteTiles (tileIds) {
    tileIds.forEach(tileId => {
      if (this.doesExist(tileId)) {
        this.#deleteTile(tileId)
      }
      this.#cullItems = LLM.remove(this.#cullItems, this.#tileIdToCacheId(tileId))
    })
  }

  addTile (tile, tileId) {
    this.#tileCache[tileId.z][tileId.x][tileId.y] = tile
    // if already exists, will just be shifted to head
    this.#cullItems = LLM.insertAtHead(this.#cullItems, this.#tileIdToCacheId(tileId), tileId)
    this.#checkCull()
  }

  getTile (tileId) {
    if (this.doesExist(tileId)) {
      // move tile to back of cull line
      this.#cullItems = LLM.shiftToHead(this.#cullItems, this.#tileIdToCacheId(tileId))
      return this.#tileCache[tileId.z][tileId.x][tileId.y]
    }
    return null
  }

}
