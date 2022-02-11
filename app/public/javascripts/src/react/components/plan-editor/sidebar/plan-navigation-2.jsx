import React, { useState } from 'react'
import { connect } from 'react-redux'
import Foldout from '../../common/foldout.jsx'
//import { getIconUrl } from '../shared'

export const FaultCode = {
	UNDEFINED: "Unknown",
	LOCATION_NOT_ASSIGNED: "Unassigned",
	LOCATION_LINK_ERROR: "Link Error",
	LOCATION_DROP_DISTANCE: "Drop Distance Exceeded",
	EQUIPMENT_FIBER_DISTANCE: "Fiber Distance Exceeded",
	EQUIPMENT_CAPACITY: "Capacity Exceeded",
}

const PlanNavigation2 = props => {
  if (!props.selectedSubnetId 
    || !props.subnets
    || !props.subnets[props.selectedSubnetId] // meaning we will not show this tree if the selected node is a Terminal or Location
  ) return null

  const [filterForAlerts, setFilterForAlerts] = useState(true)


  function makeRow (featureId, faultNode = {childNodes:[],assignedFaultCodes:[]} ) { // TODO: faultNode should probably be a defined type that is also used in state
    //  OK so this is a bit intricate but stick with me
    //  Nodes of the network, such as COs, Equipment, Locations, can have alerts. 
    //  Subnets have Alert Trees listing the alerts on nodes in that subnet.
    //  This can be confusing because we name the Subnet after it's root node; they have the same ID.
    //  So the Alert for a Hub, for example, will be on the Subnet with the same ID.
    //  A Terminal is not the root node of a Hub so the Alert for a Terminal will be a in the Alert Tree of the Subnet with the same ID as the Terminal's parent node, the Hub.
    //  NOTE: A CO, for example, can have some children that aren't Subnets and some that are. So we merge it's FaultTree.children with the fault nodes of it's subnet children.
    let payload = {
      element: null, 
      alertCount: 0,
      isLeaf: true,
    }
    payload.alertCount += faultNode.assignedFaultCodes.length

    let children = []
    let childFaultNodesById = {}
    faultNode.childNodes.forEach(childFaultNode => {
      childFaultNodesById[childFaultNode.faultReference.objectId] = childFaultNode
    })
    if (props.subnets[featureId]) {
      // it's a subnet
      children = props.subnets[featureId].children
    } else if (
      props.subnetFeatures[featureId]
      && props.subnetFeatures[featureId].feature.dropLinks
    ){
      // it's a terminal
      //  children is going to be a list of droplinks
      // planEditor.subnetFeatures["c5356f72-cbc5-49ff-b7e1-fd7e00da5e54"].feature.dropLinks[0].locationLinks[0].locationId
      props.subnetFeatures[featureId].feature.dropLinks.forEach(dropLink => {
        dropLink.locationLinks.forEach(locationLink => {
          children.push(locationLink.locationId)
        })
      })
    } // else it's a location

    // TODO: this whole icon thing is broken, I think Robert is making a new system
    let iconURL = '' // default?
    if (props.subnetFeatures[featureId]) {
      //iconURL = getIconUrl(props.subnetFeatures[featureId])
      iconURL = '/images/map_icons/aro/equipment/fiber_distribution_hub_alert.svg'
    } else {
      // location
      //  TODO: temporary placeholder icon, change this over to the new system
      iconURL = "/images/map_icons/aro/households_default.png"
    }

    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.assignedFaultCodes
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.faultReference.objectId
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.faultReference.referenceType

    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].assignedFaultCodes
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].faultReference.objectId
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].faultReference.referenceType

    let rows = []
    //var row = null
    children.forEach(childId => {
      let childFaultNode = childFaultNodesById[childId]
      if (props.subnets[childId]) {
        childFaultNode = props.subnets[childId].faultTree.rootNode
      }
      let row = makeRow(childId, childFaultNode)
      if (row.element) {
        if (!row.isLeaf) {
          rows.unshift(row.element) // put the fold outs at the top
        } else {
          rows.push(row.element) // then the leaf nodes
        }
      }
      payload.alertCount += row.alertCount
    })

    let alertElements = []
    faultNode.assignedFaultCodes.forEach(fCode => {
      alertElements.push(
        <div className="info" key={`${featureId}_${fCode}`}>
          {FaultCode[fCode]}
        </div>
      )
    })

    // filter - if this is an element we don't want don't bother building the row and just return a null element
    if (!filterForAlerts || payload.alertCount){
      let featureRow = (
        <>
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
                src={iconURL} 
              />
              <h2 className="title">{featureId}</h2>
            </div>
            {payload.alertCount 
              ? <div className="defect-info">
                  <h3 className="defect-title">{payload.alertCount}</h3>
                  <div className="svg warning"></div>
                </div>
              : null
            }
          </div>
          <div className="info">
            {alertElements}
          </div>
        </>
      )
      if (rows.length) {
        payload.element = (
          <Foldout displayName={featureRow} key={featureId}>
            {rows}
          </Foldout>
        )
        payload.isLeaf = false
      } else {
        // no children, no need for a fold out
        payload.element = <div className="nonfoldout-row" key={featureId}>{featureRow}</div>
      }
    }

    return payload
  }


  let faultNode = props.subnets[props.selectedSubnetId].faultTree.rootNode
  let element = makeRow(props.selectedSubnetId, faultNode).element

  console.log(" --- plan nav rerender --- ")
  return (
    <>
      <div>
      <div className='btn-group btn-group-sm' style={{ marginLeft: '5px' }}>
        <button className={'btn btn-sm ' + (filterForAlerts ? 'btn-primary' : 'btn-light')}
          onClick={() => setFilterForAlerts(true)}
          disabled={filterForAlerts}
        >
          Alerts
        </button>

        <button className={'btn btn-sm ' + (filterForAlerts ? 'btn-light' : 'btn-primary')}
          onClick={() => setFilterForAlerts(false)}
          disabled={!filterForAlerts}>
          All
        </button>
      </div>
      </div>
      <div className='plan-navigation slim-line-headers'>{element}</div>
    </>
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

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation2)
