class TileUtilities {

  static getTileId(zoom, tileX, tileY) {
    return `mapTile_${zoom}_${tileX}_${tileY}`
  }

}

export default TileUtilities