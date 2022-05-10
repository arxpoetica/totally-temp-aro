import React, { useState, useEffect } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanEditorSelectors from './plan-editor-selectors'
// global: tileCache.subnets

const _SubnetTileOverlay = props => {
  const {
    mapRef,
    subnetTileData,
    rootSubnetId,
  } = props
  const TILE_SIZE = 256
  // set up google maps getTile and releaseTile functions 
  let overlayLayer = {}
  overlayLayer.tileSize = new google.maps.Size(TILE_SIZE, TILE_SIZE)
  overlayLayer.getTile = (
    coord,//: google.maps.Point,
    zoom,//: number,
    ownerDocument,//: Document
  ) => {
    let sCoords = String(coord)
    console.log(`getTile ${sCoords} ${zoom}`)
    const div = ownerDocument.createElement("div");

    div.innerHTML = sCoords;
    div.style.width = overlayLayer.tileSize.width + "px";
    div.style.height = overlayLayer.tileSize.height + "px";
    div.style.fontSize = "10";
    div.style.borderStyle = "solid";
    div.style.borderWidth = "1px";
    div.style.color = div.style.borderColor = "#AAAAAA";
    return div;
  }
  overlayLayer.releaseTile = (tile) => {
    console.log(tile)
  }
  overlayLayer.redrawCachedTiles = (prop) => {console.log(prop)} // called by the OLD VTS
  
  mapRef.overlayMapTypes.push(overlayLayer)

  useEffect(() => { return () => onDestroy() }, [])
  const onDestroy = () => {
    let index = mapRef.overlayMapTypes.indexOf(overlayLayer)
    console.log(index)
    mapRef.overlayMapTypes.removeAt(index)
  }

  useEffect(() => {
    // if the data changes the cache has been updated so refresh the map
    console.log(' --- tile refresh --- ')
    let index = mapRef.overlayMapTypes.indexOf(overlayLayer)
    mapRef.overlayMapTypes.removeAt(index)
    mapRef.overlayMapTypes.push(overlayLayer)
  }, [
    subnetTileData,
    rootSubnetId,
  ])

  // No UI for this component. It deals with map objects only.
  return null
}

const mapStateToProps = (state) => {
  return {
    mapRef: state.map.googleMaps,
    subnetTileData: state.subnetTileData, 
    //selectedSubnetId: state.planEditor.selectedSubnetId,
    rootSubnetId: PlanEditorSelectors.getRootSubnetIdForSelected(state),
    // tile data, useEffect: on change tell overlayLayer to run getTile on all visible tiles using clearTileCache
    // tileOverlay.clearTileCache();
  }
}

const mapDispatchToProps = dispatch => ({

})

const SubnetTileOverlay = wrapComponentWithProvider(reduxStore, _SubnetTileOverlay, mapStateToProps, mapDispatchToProps)
export default SubnetTileOverlay
