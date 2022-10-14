import React from 'react'

const TOOL_IDS = {
  LOCATIONS: 'locations',
  NEAR_NET: 'near_net',
  CABLES: 'cables',
  COPPER: 'copper',
  CONDUITS: 'conduits',
  NETWORK_NODES: 'network_nodes',
  AREA_NETWORK_PLANNING: 'area_network_planning',
  TARGET_BUILDER: 'target_builder',
  CONSTRUCTION_SITES: 'construction_sites',
}
const availableToolsMeta = [
  {
    id: TOOL_IDS.LOCATIONS,
    name: 'Locations',
    icon: 'fa fa-building fa-2x',
  },
  {
    id: TOOL_IDS.NEAR_NET,
    name: 'Near Net',
    icon: 'fa fa-building fa-2x',
  },
  {
    id: TOOL_IDS.NETWORK_NODES,
    name: 'Network Equipment',
    icon: 'fa fa-sitemap fa-2x',
  },
  {
    id: TOOL_IDS.CABLES,
    name: 'Cables',
    icon: 'fab fa-usb fa-2x',
  },
  {
    id: TOOL_IDS.COPPER,
    name: 'Copper',
    icon: 'fa fa-draw-polygon fa-2x',
  },
  {
    id: TOOL_IDS.CONDUITS,
    name: 'Conduits',
    icon: 'fas fa-road fa-2x',
  },
  {
    id: 'fiber_plant',
    name: 'Competitor Networks',
    icon: 'fa fa-flag-checkered fa-2x',
  },
  {
    id: 'boundaries',
    name: 'Boundaries',
    icon: 'fa fa-th fa-2x',
  },
]

export const MapToolIcon = ({ toolId, handleClick, active }) => {
  return (
    <div
      className={`icon btn btn-primary map-tools-button text-white ${active ? 'active' : ''}`}
      onClick={handleClick}
    >
      <i className={"icon-image " + availableToolsMeta.filter(({ id }) => id === toolId)[0].icon} />
      <style jsx>
        {`
        .icon {
          margin-bottom: 1rem;
        }
        .icon-image {
          color: rgb(255 255 255);
          line-height: 48px;
          margin: 0px;
          padding: 0px;
          text-align: center;
        }
        `}
      </style>
    </div>
  )
}
