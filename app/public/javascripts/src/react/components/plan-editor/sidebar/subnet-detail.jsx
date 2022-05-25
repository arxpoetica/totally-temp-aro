import React, { useState } from 'react'
import { connect } from 'react-redux'
import { FaultCode } from './plan-navigation.jsx'
import Foldout from '../../common/foldout.jsx'
import MapLayerSelectors from '../../map-layers/map-layer-selectors'
import PlanEditorSelectors from '../plan-editor-selectors'
import NavigationMarker from './navigation-marker.jsx'
import WktUtils from '../../../../shared-utils/wkt-utils.js'

const SubnetDetail = props => {
  const [hoverPosition, setHoverPosition] = useState(null)

  function onNodeClick(featureId) {
    props.map.setCenter(getHoverPosition(featureId))
    // Allow the user to see the nav marker after setCenter then clear
    setTimeout(() => {
      setHoverPosition(null)
    }, 500)
  }
  function getHoverPosition(featureId) {
    let locationAlert = props.locationAlerts[featureId]
    if (!locationAlert) {
      let allEquipment = [] // should probably put into selector
      Object.values(props.rootDrafts).forEach(draft => {
        allEquipment = allEquipment.concat(draft.equipment)
      })
      const node = allEquipment.find(node => node.id === featureId)
      return WktUtils.getGoogleMapLatLngFromWKTPoint(node.point)
    }
    const { point } = locationAlert
    return { lat: point.latitude, lng: point.longitude }
  }

  function disableRows() {
    return (!props.selectedSubnetId 
      || !props.subnets
      || !props.subnets[props.selectedSubnetId] // meaning we will not show this detail if the selected node is a Terminal or Location
      || !props.subnets[props.selectedSubnetId].faultTree.rootNode.childNodes.length
    )
  }

  function makeFaultRows (faultTree) {
    let elements = []
    // planEditor.subnets["6a98a2e6-6785-41cd-8700-a2c9109f1ceb"].faultTree.rootNode.childNodes[0].childNodes
    faultTree.rootNode.childNodes.forEach(faultNode => {
      elements.push(makeFaultRow(faultNode))
    })

    return elements
  }

  function countDefects(node, alertCount = 0) {
    if (node.childNodes.length === 0) {
      return node.assignedFaultCodes.length
    }
    node.childNodes.forEach((childNode) => {
      alertCount += countDefects(childNode, alertCount)
    })

    return alertCount;
  }

  function makeFaultRow (faultNode) {
    let element = null
    let alertElements = []
    const featureId = faultNode.faultReference.objectId
    // two problems here
    //  A: We get all our info from fault tree 
    //  so this doesn't really work when showing the "ALL" network under a hub
    //  worse yet, however we show the network under a hub if we use the same function for a CO 
    //  we're going to get duplicate info with the plan nav list of hubs
    //
    //  B: there is a server side bug where all entries in subnetLocationsById show networkNodeType: as the parent, we need the location type
    let iconURL = props.iconsByType._alert['household']
    if (props.subnetFeatures[featureId]) {
      let featureType = props.subnetFeatures[featureId].feature.networkNodeType
      iconURL = props.iconsByType._alert[featureType]
    }
    faultNode.assignedFaultCodes.forEach(fCode => {
      alertElements.push(
        <div className="info" key={`${featureId}_${fCode}`}>
          {FaultCode[fCode]}
        </div>
      )
    })

    let rows = []
    faultNode.childNodes.forEach(childNode => {
      rows.push(makeFaultRow(childNode))
    })

    let alertCount = faultNode.assignedFaultCodes.length;
    if (alertCount === 0 && faultNode.childNodes.length > 0) {
      // Handle nested subnets not in the draft skeleton
      alertCount = countDefects(faultNode)
    }

    const nodeType = props.subnetFeatures[featureId]
      ? props.subnetFeatures[featureId].feature.networkNodeType
      : "location"

    let featureRow = (
      <>
        <div className="header">
          <div
            className="info"
            onMouseEnter={() => setHoverPosition(getHoverPosition(featureId))}
            onMouseLeave={() => setHoverPosition(null)}
            onClick={() => onNodeClick(featureId)}
          >
            <img 
              style={{ 'width': '20px' }}
              src={iconURL} 
            />
            <h2 className="title">
              { nodeType.replaceAll("_", " ") }
            </h2>
          </div>
          {alertCount ? (
            <div className="defect-info">
              <h3 className="defect-title">{alertCount}</h3>
              <div className="svg warning"></div>
            </div>
          ) : null}
        </div>
        <div className="info">
          {alertElements}
        </div>
      </>
    )
    if (rows.length) {
      element = (
        <Foldout displayName={featureRow} key={featureId}>
          {rows}
        </Foldout>
      )
      //payload.isLeaf = false
    } else {
      // no children, no need for a fold out
      element = <div className="nonfoldout-row" key={featureId}>{featureRow}</div>
    }
      
    return element
  }

  return (
    <>
      {!disableRows() && makeFaultRows(props.subnets[props.selectedSubnetId].faultTree)}
      <NavigationMarker isHover={!!hoverPosition} position={hoverPosition} />
    </>
  )
}

const mapStateToProps = state => {
  return {
    selectedSubnetId: state.planEditor.selectedSubnetId,
    subnets: state.planEditor.subnets, 
    subnetFeatures: state.planEditor.subnetFeatures,
    rootDrafts: PlanEditorSelectors.getRootDrafts(state),
    locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
    iconsByType: MapLayerSelectors.getIconsByType(state), // TODO: use new icon system
    map: state.map.googleMaps,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SubnetDetail)
