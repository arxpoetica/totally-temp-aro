import React, { useState } from 'react'
import { connect } from 'react-redux'


const SubnetDetail = props => {
  if (!props.selectedSubnetId 
    || !props.subnets
    || !props.subnets[props.selectedSubnetId] // meaning we will not show this detail if the selected node is a Terminal or Location
  ) return null
  
  return (
    <div>
      detail here for 
      <br/>{props.selectedSubnetId}
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
