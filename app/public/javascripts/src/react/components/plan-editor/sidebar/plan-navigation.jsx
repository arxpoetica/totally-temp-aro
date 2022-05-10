import React, { useState } from 'react'
import { connect } from 'react-redux'
import Foldout from '../../common/foldout.jsx'
import SubnetDetail from './subnet-detail.jsx'
import MapLayerSelectors from '../../../components/map-layers/map-layer-selectors'
import PlanEditorActions from '../plan-editor-actions'
import PlanEditorSelectors from '../plan-editor-selectors'
import NavigationMarker from './navigation-marker.jsx'
import WktUtils from '../../../../shared-utils/wkt-utils.js'

// FIXME: needs to be aligned with `ALERT_TYPES`
// import { constants } from '../shared'
// const { ALERT_TYPES } = constants
// TODO: future: may add unique icons for each
export const FaultCode = {
	UNDEFINED: 'Unknown',
	LOCATION_NOT_ASSIGNED: 'Abandoned Location', // ABANDONED_LOCATION
	LOCATION_LINK_ERROR: 'Link Error', // ?????
  // not covered? MAX_TERMINAL_HOMES_EXCEEDED
	LOCATION_DROP_DISTANCE: 'Drop Cable Length Exceeded', // MAX_DROP_LENGTH_EXCEEDED
	EQUIPMENT_CAPACITY: 'Maximum Hub Homes Exceeded', // MAX_HUB_HOMES_EXCEEDED
	EQUIPMENT_FIBER_DISTANCE: 'Fiber Distance Exceeded', // MAX_HUB_DISTANCE_EXCEEDED
}

const DefaultFaultCounts = {
  UNDEFINED: 0,
  LOCATION_NOT_ASSIGNED: 0,
  LOCATION_LINK_ERROR: 0,
  LOCATION_DROP_DISTANCE: 0,
  EQUIPMENT_CAPACITY: 0,
  EQUIPMENT_FIBER_DISTANCE: 0,
}

const PlanNavigation = props => {
  if (!Object.keys(props.drafts).length) return null

  const [filterForAlerts, setFilterForAlerts] = useState(false)
  const [hoverPosition, setHoverPosition] = useState(null)

  function getHoverPosition(featureId) {
    // get single list of all root draft equipment
    let allEquipment = [] // should probably put into selector
    Object.values(props.rootDrafts).forEach(draft => {
      allEquipment = allEquipment.concat(draft.equipment)
    })
    // Ring plans don't have entries for for equipment
    const node = allEquipment.find(node => node.id === featureId)
    //if (!node || !node.point) return null
    return WktUtils.getGoogleMapLatLngFromWKTPoint(node.point)
  }

  function onNodeClick (event, featureId) {
    event.stopPropagation()
    props.selectEditFeaturesById([featureId])
    props.map.setCenter(getHoverPosition(featureId))
    // Allow the user to see the nav marker after setCenter then clear
    setTimeout(() => {
      setHoverPosition(null)
    }, 500)
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
    let featureId = node.draft.subnetId
    const isSelected = props.selectedSubnetId == featureId
    let payload = {
      element: null, 
      isLeaf: true,
      isChildSelected: isSelected,
      faultCounts: JSON.parse(JSON.stringify(DefaultFaultCounts)),
    }
    // we need alert count from leaves up so we build the children first 
    let childRows = []
    Object.keys(node.children).forEach(childId => {
      let childNode = node.children[childId]
      let childRow = makeRow(childNode)
      if (childRow.element) {
        // if (!childRow.isLeaf) {
        //   childRows.unshift(childRow.element) // put the fold outs at the top
        // } else {
        //   childRows.push(childRow.element) // then the leaf nodes
        // }
        childRows.push(childRow.element)
        // merge alerts childRow.faultCounts
        payload.faultCounts = mergeFaultCounts(payload.faultCounts, childRow.faultCounts)
        payload.isChildSelected = payload.isChildSelected || childRow.isChildSelected
      }
    })
    // Do we want to include node faults in the total count?
    let nodeFaultCounts = JSON.parse(JSON.stringify(DefaultFaultCounts))
    if (node.draft.faultTreeSummary && node.draft.faultTreeSummary.faultCounts) {
      nodeFaultCounts = node.draft.faultTreeSummary.faultCounts
    }
    payload.faultCounts = mergeFaultCounts(payload.faultCounts, nodeFaultCounts)
    let faultSum = sumFaultCounts(payload.faultCounts)
    // now we have alert counts and child rows (if any) 
    
    let iconURL;
    if (faultSum) {
      iconURL = props.iconsByType._alert[ node.draft.nodeType ]
    } else {
      iconURL = props.iconsByType[ node.draft.nodeType ]
    }

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
      
      if (isSelected) {
        childRows.unshift(
          <div className="info" key={`selected_${featureId}`}>
            <SubnetDetail></SubnetDetail>
          </div>
        )
      }
      const nodeType = props.drafts[featureId] && props.drafts[featureId].nodeType
      
      let featureRow = (
        <>
          {/* {console.log(props.drafts[featureId])} */}
          <div className="header">
            <div
              className={'info plan-nav-node-name' + (isSelected ? ' selected' : '')}
              onMouseEnter={() => setHoverPosition(getHoverPosition(featureId))}
              onMouseLeave={() => setHoverPosition(null)}
              onClick={event => onNodeClick(event, featureId)}
            >
              <img 
                style={{'width': '20px'}}
                src={iconURL} 
              />
              <h2 className="title">
                { nodeType && nodeType.replaceAll("_", " ") }
              </h2>
            </div>
            {faultSum 
              ? <div className="defect-info">
                  <h3 className="defect-title">{faultSum}</h3>
                  <div className="svg warning"></div>
                </div>
              : null
            }
          </div>
          <div className="plan-nav-alert-list">
            {alertElements}
          </div>
        </>
      )
      if (childRows.length) {
        payload.element = (
          <Foldout displayName={featureRow} key={featureId} initIsOpen={payload.isChildSelected}>
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

  let tree = makeTree(props.drafts)
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
      <NavigationMarker isHover={!!hoverPosition} position={hoverPosition} />
    </>
  )
}

const mapStateToProps = state => {
  return {
    selectedSubnetId: state.planEditor.selectedSubnetId,
    subnetFeatures: state.planEditor.subnetFeatures,
    drafts: state.planEditor.drafts,
    rootDrafts: PlanEditorSelectors.getRootDrafts(state),
    iconsByType: MapLayerSelectors.getIconsByType(state),
    map: state.map.googleMaps,
  }
}

const mapDispatchToProps = dispatch => ({
  selectEditFeaturesById: ids => dispatch(PlanEditorActions.selectEditFeaturesById(ids)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation)
