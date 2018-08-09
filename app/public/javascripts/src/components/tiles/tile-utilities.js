class TileUtilities {

  static getTileId(zoom, tileX, tileY) {
    return `${zoom}-${tileX}-${tileY}`
  }

}

export default TileUtilities