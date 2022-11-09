import {LinkedListMutator as LLM} from "../../../common/linked-list-mutator"
import { klona } from 'klona'
import TileUtils from './tile-overlay-utils' // I'm not sure this belongsa here
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

class TileCache {
  constructor (itemLimit = 1024) { // 1024 is just a default, set it to what is appropriate for your system 
    this.itemLimit = itemLimit
    this.clear()
  }

  // --- private --- //

  _tileIdToCacheId (tileId) {
    return `${tileId.z}_${tileId.x}_${tileId.y}`
  }

  _checkCull () {
    let cullCount = LLM.getCount(this._cullItems)
    cullCount -= this.itemLimit
    if (0 < cullCount) {
      for (let i=0; i<cullCount; i++) {
        let tailTileId = LLM.getTail(this._cullItems).value
        this._deleteTile(tailTileId)
        this._cullItems = LLM.removeTail(this._cullItems)
      }
    }
  }

  // private, removes tile element ONLY
  //  the caller should also call tileCull.removeElement UNLESS the caller is tileCull 
  _deleteTile (tileId) {
    delete this._tileCache[tileId.z][tileId.x][tileId.y]
    // z.x is now empty remove it
    if (!Object.keys(this._tileCache[tileId.z][tileId.x]).length) {
      delete this._tileCache[tileId.z][tileId.x]
      // if z is now empty remove it
      if (!Object.keys(this._tileCache[tileId.z]).length) {
        delete this._tileCache[tileId.z]
      }
    }
  }

  // --- public --- //

  clear () {
    this._tileCache = {} // [z][x][y]
    // ToDo: in the future, the culling mechanism should be a seperate class 
    //  that encompasses multiple caches. 
    //  Such that adding a tile to one cache can cause a cull on a different, older cache  
    this._cullItems = LLM.getNewLinkedList() // head is new, tail is old
  }

  doesExist (tileId) {
    if (
      this._tileCache[tileId.z]
      && this._tileCache[tileId.z][tileId.x]
      && this._tileCache[tileId.z][tileId.x][tileId.y]
    ) {
      return true
    }
    return false
  }

  // image cache will probably keep it's own setters and getters for limit reasons
  deleteTiles (tileIds) {
    tileIds.forEach(tileId => {
      if (this.doesExist(tileId)) {
        this._deleteTile(tileId)
      }
      this._cullItems = LLM.remove(this._cullItems, this._tileIdToCacheId(tileId))
    })
  }

  deleteTilesForWorldCoord = (worldCoord) => {
    let allTileIds = TileUtils.getAllTileIdsForWorldCoord(worldCoord)
    this.deleteTiles(allTileIds)
  }

  addTile (tile, tileId) {
    if (!this._tileCache[tileId.z]) this._tileCache[tileId.z] = {}
    if (!this._tileCache[tileId.z][tileId.x]) this._tileCache[tileId.z][tileId.x] = {}
    this._tileCache[tileId.z][tileId.x][tileId.y] = tile
    // if already exists, will just be shifted to head
    this._cullItems = LLM.insertAtHead(this._cullItems, this._tileIdToCacheId(tileId), tileId)
    this._checkCull()
  }

  getTile (tileId) {
    if (this.doesExist(tileId)) {
      // move tile to back of cull line
      this._cullItems = LLM.shiftToHead(this._cullItems, this._tileIdToCacheId(tileId))
      return this._tileCache[tileId.z][tileId.x][tileId.y]
    }
    return null
  }

}

// the three sisters:
//  - tile cache
//  - tile data
//  - entity data
//  are somewhat coupled and should all have the same top level indices, they are defined here:
const mapDataIndices = Object.freeze({
  nearnet: {},
  subnets: {},
  unbounded: {},
})

let tileCaches = klona(mapDataIndices)
//tileCaches.nearnet = new TileCache() // near net doesn't have ID indicies 

export {TileCache, tileCaches, mapDataIndices}
