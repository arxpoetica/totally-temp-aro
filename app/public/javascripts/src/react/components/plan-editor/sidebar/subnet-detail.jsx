import React, { useState } from 'react'
import { connect } from 'react-redux'


const SubnetDetail = props => {
  if (!props.selectedSubnetId 
    || !props.subnets
    || !props.subnets[props.selectedSubnetId] // meaning we will not show this detail if the selected node is a Terminal or Location
    || !props.subnets[props.selectedSubnetId].faultTree.rootNode.childNodes.length
  ) return null
  
  function makeFaultRows (faultTree) {
    return "details go here"
  }

  let element = makeFaultRows(props.subnets[props.selectedSubnetId].faultTree)

  return (
    <div>
      element
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
