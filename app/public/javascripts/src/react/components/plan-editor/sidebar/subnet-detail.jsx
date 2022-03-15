import React, { useState } from 'react'
import { connect } from 'react-redux'
import { FaultCode } from './plan-navigation.jsx'
import Foldout from '../../common/foldout.jsx'
import MapLayerSelectors from '../../map-layers/map-layer-selectors'


const SubnetDetail = props => {
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

    let featureRow = (
      <>
        <div className="header">
          <div className='info'>
            <img 
              style={{'width': '20px'}}
              src={iconURL} 
            />
            <h2 className="title">{featureId}</h2>
          </div>
          {faultNode.assignedFaultCodes.length && (
            <div className="defect-info">
              <h3 className="defect-title">{faultNode.assignedFaultCodes.length}</h3>
              <div className="svg warning"></div>
            </div>
          )}
          
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
    </>
  )
}

const mapStateToProps = state => {
  return {
    selectedSubnetId: state.planEditor.selectedSubnetId,
    subnets: state.planEditor.subnets, 
    subnetFeatures: state.planEditor.subnetFeatures,
    iconsByType: MapLayerSelectors.getIconsByType(state),
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SubnetDetail)
