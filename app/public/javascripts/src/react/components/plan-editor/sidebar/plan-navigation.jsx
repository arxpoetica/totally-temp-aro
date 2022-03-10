import React, { useState } from 'react'
import { connect } from 'react-redux'
import Foldout from '../../common/foldout.jsx'
import SubnetDetail from './subnet-detail.jsx'
//import { getIconUrl } from '../shared'
import MapLayerSelectors from '../../../components/map-layers/map-layer-selectors'

export const FaultCode = { // future: may add unique icons for each
	UNDEFINED: "Unknown",
	LOCATION_NOT_ASSIGNED: "Unassigned",
	LOCATION_LINK_ERROR: "Link Error",
	LOCATION_DROP_DISTANCE: "Drop Distance Exceeded",
	EQUIPMENT_FIBER_DISTANCE: "Fiber Distance Exceeded",
	EQUIPMENT_CAPACITY: "Capacity Exceeded",
}

const DefaultFaultCounts = {
  "UNDEFINED": 0,
  "LOCATION_NOT_ASSIGNED": 0,
  "LOCATION_LINK_ERROR": 0,
  "LOCATION_DROP_DISTANCE": 0,
  "EQUIPMENT_FIBER_DISTANCE": 0,
  "EQUIPMENT_CAPACITY": 0,
}

const PlanNavigation = props => {
  if (!props.drafts) return null;

  const [filterForAlerts, setFilterForAlerts] = useState(true)

  function getEquipmentIcon (networkNodeType, ) {

  }

  function makeListNode () {
    return {draft: {}, children: {}}
  }

  function makeTree (drafts) {
    // for this tree sort we're going to use (abuse) 
    //  the fact that objects are referenced 
    //  such that when root['123'] = subnet['123'] 
    //  when we do subnet['123'].['abc'] = "value"
    //  we also get root['123'].['abc']: "value"
    //  AND 
    //  when subnet['123'].['abc'] = subnet['abc']
    //  subnet['abc'].val = 'value too'
    //  also yealds subnet['123'].['abc'].val: 'value too'
    let roots = {}
    let subnets = {}
    Object.keys(drafts).forEach(id => {
      let draft = drafts[id]
      let parentSubnetId = draft.parentSubnetId
      if (!subnets[id]) { // may have been made by a child element
        // for collecting children, may end up empty
        subnets[id] = makeListNode()
      }
      subnets[id].draft = draft

      if (!parentSubnetId) {
        // no parent so it's a root
        roots[id] = subnets[id]
      } else {
        if (!subnets[parentSubnetId]) {
          subnets[parentSubnetId] = makeListNode()
        }
        subnets[parentSubnetId].children[id] = subnets[id] // NOTE the self reference
      }
    })
    // now because of reference, roots should have a tree structure of each root node down to leaf
    //  and the subnets object can be discarded
    //  interestingly subnets is BOTH flat AND structured because of self reference (could be useful for other aplications)
    //  do keep in mind if you serialize the subnets object you loose the pointers and thus loose the self reference 
    return roots
  }

  function mergeFaultCounts (fcA, fcB) {
    // we depend on fcA and fcB having the same properties
    //  TODO: I would love a way to strong type functional data stores
    //  we can be assured of the type of fcA and fcB 
    //  while still haveing them be JSON serializable, meaning we can't use classes
    //  I suppose we could use the old prototype constructor method
    let fcC = JSON.parse(JSON.stringify(fcA))
    Object.keys(fcB).forEach(faultCode => {
      fcC[faultCode] += fcB[faultCode]
    })
    return fcC
  }

  function sumFaultCounts (fc) {
    let sum = 0
    Object.keys(fc).forEach(faultCode => {
      sum += fc[faultCode]
    })
    return sum
  }

  function makeRow (node) {
    let payload = {
      element: null, 
      isLeaf: true,
      faultCounts: JSON.parse(JSON.stringify(DefaultFaultCounts)),
    }
    // we need alert count from leaves up so we build the children first 
    let childRows = []
    Object.keys(node.children).forEach(childId => {
      let childNode = node.children[childId]
      let childRow = makeRow(childNode)
      if (childRow.element) {
        if (!childRow.isLeaf) {
          childRows.unshift(childRow.element) // put the fold outs at the top
        } else {
          childRows.push(childRow.element) // then the leaf nodes
        }
        // merge alerts childRow.faultCounts
        payload.faultCounts = mergeFaultCounts(payload.faultCounts, childRow.faultCounts)
      }
    })
    //let nodeType = node.draft.nodeType
    let featureId = node.draft.subnetId
    // Do we want to include node faults in the total count?
    let nodeFaultCounts = JSON.parse(JSON.stringify(DefaultFaultCounts))
    if (node.draft.faultTreeSummary && node.draft.faultTreeSummary.faultCounts) {
      nodeFaultCounts = node.draft.faultTreeSummary.faultCounts
    }
    payload.faultCounts = mergeFaultCounts(payload.faultCounts, nodeFaultCounts)
    let faultSum = sumFaultCounts(payload.faultCounts)
    // now we have alert counts and child rows (if any) 
    
    // TODO: this whole icon thing is broken, I think Robert is making a new system
    //let iconURL = '/images/map_icons/aro/equipment/fiber_distribution_hub_alert.svg'
    let iconURL = props.iconsByType[ node.draft.nodeType ]
    //mapLayers.networkEquipment.equipments.central_office.iconUrl
    //mapLayers.location._tail.array[0].key

    //  we filter by alert 
    // filter - if this is an element we don't want don't bother building the row and just return a null element
    if (!filterForAlerts || faultSum){

      let alertElements = []
      Object.keys(nodeFaultCounts).forEach(fCode => {
        if (nodeFaultCounts[fCode]) {
          alertElements.push(
            <div className="info" key={`${featureId}_${fCode}`}>
              {FaultCode[fCode]}: {nodeFaultCounts[fCode]}
            </div>
          )
        }
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
            {faultSum 
              ? <div className="defect-info">
                  <h3 className="defect-title">{faultSum}</h3>
                  <div className="svg warning"></div>
                </div>
              : null
            }
          </div>
          <div>
            {alertElements}
          </div>
          {props.selectedSubnetId == featureId
            ? <SubnetDetail></SubnetDetail>
            : null
          }
        </>
      )
      if (childRows.length) {
        payload.element = (
          <Foldout displayName={featureRow} key={featureId}>
            {childRows}
          </Foldout>
        )
        payload.isLeaf = false
      } else {
        // no children, no need for a fold out
        payload.element = <div className="nonfoldout-row" key={featureId}>{featureRow}</div>
      }
    }

    return payload
    //  we make a fold out if children 
    //  else we make a flat header 
    //  if alerts on THIS NODE we include them in the header
    //  if this is the selected subnet we include SubnetDetail 
  }
  /*
  function makeRow_OLD (featureId, faultNode = {childNodes:[],assignedFaultCodes:[]} ) { // TODO: faultNode should probably be a defined type that is also used in state
    //  OK so this is a bit intricate but stick with me
    //  Nodes of the network, such as COs, Equipment, Locations, can have alerts. 
    //  Subnets have Alert Trees listing the alerts on nodes in that subnet.
    //  This can be confusing because we name the Subnet after it's root node; they have the same ID.
    //  So the Alert for a Hub, for example, will be on the Subnet with the same ID.
    //  A Terminal is not the root node of a Subnet so the Alert for a Terminal will be a in the Alert Tree of the Subnet with the same ID as the Terminal's parent node, the Hub.
    //  NOTE: A CO, for example, can have some children that aren't Subnets and some that are. So we merge it's FaultTree.children with the fault nodes of it's subnet children.
    
    // Fault Tree for a subnet
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.assignedFaultCodes
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.faultReference.objectId
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.faultReference.referenceType

    // Fault Tree for Terminal via the parent subnet
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].assignedFaultCodes
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].faultReference.objectId
    // planEditor.subnets["c8b405fd-8b13-4293-9698-c7c310982894"].faultTree.rootNode.childNodes[0].childNodes[0].faultReference.referenceType
    
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
  */

  //let faultNode = props.subnets[props.selectedSubnetId].faultTree.rootNode
  //let element = makeRow(props.selectedSubnetId, faultNode).element
  let tree = makeTree(props.drafts)
  console.log(tree)
  //console.log( props.iconsByType ) 
  let element = []
  Object.keys(tree).forEach(id => {
    element.push(makeRow(tree[id]).element)
  })

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
    //subnets: state.planEditor.subnets, use only in child
    //subnetFeatures: state.planEditor.subnetFeatures,
    drafts: state.planEditor.drafts,
    iconsByType: MapLayerSelectors.getIconsByType(state),
  }
}

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation)
