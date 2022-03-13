import React, { useState } from 'react'
import { connect } from 'react-redux'
import { FaultCode } from './plan-navigation.jsx'
import Foldout from '../../common/foldout.jsx'


const SubnetDetail = props => {
  if (!props.selectedSubnetId 
    || !props.subnets
    || !props.subnets[props.selectedSubnetId] // meaning we will not show this detail if the selected node is a Terminal or Location
    || !props.subnets[props.selectedSubnetId].faultTree.rootNode.childNodes.length
  ) return null
  
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
    const iconURL = ''
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
          {/*payload.alertCount 
            ? <div className="defect-info">
                <h3 className="defect-title">{payload.alertCount}</h3>
                <div className="svg warning"></div>
              </div>
            : null
          */}
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

  let element = makeFaultRows(props.subnets[props.selectedSubnetId].faultTree)

  return (
    <div>
      {element}
    </div>
  )
}

const mapStateToProps = state => {
  return {
    selectedSubnetId: state.planEditor.selectedSubnetId,
    subnets: state.planEditor.subnets, 
    subnetFeatures: state.planEditor.subnetFeatures,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SubnetDetail)
