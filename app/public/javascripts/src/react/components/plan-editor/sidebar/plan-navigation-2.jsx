import React from 'react'
import { connect } from 'react-redux'
import Foldout from '../../common/foldout.jsx'

const PlanNavigation2 = props => {
  if (!props.selectedSubnetId || !props.subnets) return null

  function makeRow (featureId) {
    let payload = {
      element: null, 
      alertCount: 0,
    }

    let children = []
    if (props.subnets[featureId]) {
      // it's a subnet
      children = props.subnets[featureId].children
    } else if (props.subnetFeatures[featureId]){
      // it's a terminal or a location
      // temp
      //children = 
    }

    let rows = []
    //var row = null
    children.forEach(childId => {
      let row = makeRow(childId)
      if (row.element) rows.push(row.element)
      payload.alertCount += row.alertCount
    })

    let featureRow = (
      <div className="header">
        <div className='info'>
          { /*
          <div
            className="svg location"
            style={{backgroundImage: `url('/images/map_icons/aro/equipment/fiber_distribution_hub_alert.svg')`}}
          ></div>
          */ }
          <img 
            style={{'width': '20px'}}
            src="/images/map_icons/aro/equipment/fiber_distribution_hub_alert.svg" 
          />
          <h2 className="title">{featureId}</h2>
        </div>
        <div className="defect-info">
          <h3 className="defect-title">{payload.alertCount}</h3>
          <div className="svg warning"></div>
        </div>
      </div>
    )
    if (rows.length) {
      payload.element = (
        <Foldout displayName={featureRow} key={featureId}>
          {rows}
        </Foldout>
      )
    } else {
      // no children, no need for a fold out
      payload.element = <div className="nonfoldout-row" key={featureId}>{featureRow}</div>
    }

    return payload
  }

  let element = makeRow(props.selectedSubnetId).element

  console.log(" --- plan nav rerender --- ")
  return <div className='plan-navigation slim-line-headers'>{element}</div>
}

const mapStateToProps = state => {

  return {
    selectedSubnetId: state.planEditor.selectedSubnetId,
    subnets: state.planEditor.subnets,
    subnetFeatures: state.planEditor.subnetFeatures,
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation2)
