import React, { useReducer, createContext } from 'react'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import reduxStore from '../../../redux-store'
import { mapToolReducer } from './map-tool-reducer'
import BoundariesPanel from './panels/boundaries.jsx'
import CompetitionPanel from './panels/competition.jsx'
import ConduitsPanel from './panels/conduits.jsx'
import CopperPanel from './panels/copper.jsx'
import FibersPanel from "./panels/fibers.jsx"
import LocationsPanel from './panels/locations.jsx'
import NetworkEquipmentPanel from './panels/network.jsx'

export const MapToolActions = {
  MAP_SET_MAP_TOOLS: 'MAP_SET_MAP_TOOLS',
  MAP_SET_SHOW_MAP_TOOL: 'MAP_SET_SHOW_MAP_TOOL',
  MAP_SET_HIDE_MAP_TOOL: 'MAP_SET_HIDE_MAP_TOOL',
  MAP_SET_TOGGLE_MAP_TOOL: 'MAP_SET_TOGGLE_MAP_TOOL',
  MAP_SET_EXPAND_MAP_TOOL: 'MAP_SET_EXPAND_MAP_TOOL',
  MAP_SET_COLLAPSE_MAP_TOOL: 'MAP_SET_COLLAPSE_MAP_TOOL',
}

const mapToolIntialState = {
  tools: {
    TOOL_IDS: {
      LOCATIONS: 'locations',
      CABLES: 'cables',
      COPPER: 'copper',
      CONDUITS: 'conduits',
      NETWORK_NODES: 'network_nodes',
      AREA_NETWORK_PLANNING: 'area_network_planning',
      TARGET_BUILDER: 'target_builder',
      CONSTRUCTION_SITES: 'construction_sites',
    },
    available_tools: [
      {
        id: 'locations',
        toolName: 'Locations',
        icon: 'fa fa-building fa-2x',
      },
      {
        id: 'network_nodes',
        toolName: 'Network Equipment',
        icon: 'fa fa-sitemap fa-2x',
      },
      {
        id: 'cables',
        toolName: 'Cables',
        icon: 'fab fa-usb fa-2x',
      },
      {
        id: 'copper',
        toolName: 'Copper',
        icon: 'fa fa-draw-polygon fa-2x',
      },
      {
        id: 'conduits',
        toolName: 'Conduits',
        icon: 'fas fa-road fa-2x',
      },
      {
        id: 'fiber_plant',
        toolName: 'Competitor Networks',
        icon: 'fa fa-flag-checkered fa-2x',
      },
      {
        id: 'boundaries',
        toolName: 'Boundaries',
        icon: 'fa fa-th fa-2x',
      },
      
    ],
  },
  visible: [],
  collapsed: {},
  disabled: [],
}

const MapToolPanels = {
  boundaries: BoundariesPanel,
  fiber_plant: CompetitionPanel,
  conduits: ConduitsPanel,
  copper: CopperPanel,
  cables: FibersPanel,
  locations: LocationsPanel,
  network_nodes: NetworkEquipmentPanel,
}

function isMapToolEnabled(disabled, toolName) {
  return disabled.indexOf(toolName) === -1
}

const allRulerActions = Object.freeze({
  STRAIGHT_LINE: { id: 'STRAIGHT_LINE', label: 'Straight Line' },
  ROAD_SEGMENT: { id: 'ROAD_SEGMENT', label: 'Road Segment' },
  COPPER: { id: 'COPPER', label: 'Copper' }
})

export const MapToolContext = createContext()

const MapDisplayTools = ({ mapRef }) => {

  const [mapToolState, dispatch] = useReducer(mapToolReducer, mapToolIntialState)

  const { tools : { available_tools } } = mapToolState
  // TODO: a lot of repeat code with network.jsx 
  const globalMethods = {
    MapToolActions,
    isMapToolVisible: (visible, disabled, toolName) =>
      Boolean(visible.indexOf(toolName) !== -1 && isMapToolEnabled(disabled, toolName)),
    isMapToolExpanded: (collapsed, toolName) => !Boolean(collapsed[toolName]),
    objectKeyReplace: (obj, searchText, replaceText) => { // TODO: this should probably be a global util, its not context dependent; it should never change
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replaceAll(searchText, replaceText)
        }
      })
    },
    rulerActions: [
      allRulerActions.STRAIGHT_LINE,
      allRulerActions.ROAD_SEGMENT,
    ],
    allRulerActions,
    getLineTransformForLayer: (zoomThreshold) => {
      let mapZoom = mapRef.getZoom()
      // If we are zoomed in beyond a threshold, use 'select'. If we are zoomed out, use 'aggregate'
      // (Google maps zoom starts at 0 for the entire world and increases as you zoom in)
      return (mapZoom > zoomThreshold) ? 'select' : 'smooth_absolute'
    }
  }


  return (
    <div className="map-display-tools">
      <MapToolContext.Provider value={{ mapToolState, dispatch, globalMethods }}>
        {available_tools.map(({id, toolName}) => {
          const MapToolComponent = MapToolPanels[id]
          return MapToolComponent && <MapToolComponent key={id} mapToolName={toolName} />
        })}
      </MapToolContext.Provider>
      {/*
        NOTE: we had to put `fadeInLeft` and `fadeOutLeft` in backtick quotes
        because of a styled jsx bug that doesn't recognize unknown property values
      */}
      <style jsx>{`
        .map-display-tools :global(.show) { animation: ${`fadeInLeft`} 0.5s; }
        .map-display-tools :global(.hide) { animation: ${`fadeOutLeft`} 0.5s; }
      `}</style>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    mapRef: state.map.googleMaps,
  }
}

const MapDisplayToolsComponent = wrapComponentWithProvider(reduxStore, MapDisplayTools, mapStateToProps)
export default MapDisplayToolsComponent
