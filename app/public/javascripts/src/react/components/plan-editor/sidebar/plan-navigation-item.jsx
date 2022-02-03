import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'
import cx from 'clsx'
// import { constants } from '../shared'
// const { ALERT_TYPES, Z_INDEX_PIN } = constants

// FIXME: will draw most props from state
const PlanNavigationItem = ({ subnets, subnet }) => {

  const [open, setOpen] = useState(true)

  const children = ((subnet && subnet.children) || [])
    .map(childId => subnets[childId])
    .filter(Boolean)

  return (
    <li className="item">
      <div className="header">
        <div className={cx('info', children.length < 1 && 'no-plus-minus')}>
          {children.length > 0 &&
            <div
              className={cx('svg', 'plus-minus', open && 'open')}
              onClick={() => setOpen(!open)}
            ></div>
          }
          <div
            className="svg location"
            style={ { backgroundImage: `url('/images/map_icons/aro/equipment/fiber_distribution_hub_alert.svg')` } }
          ></div>
          <h2 className="title">{subnet.subnetNode}</h2>
        </div>
        <div className="defect-info">
          <h3 className="defect-title">1 defect</h3>
          <div className="svg warning"></div>
        </div>
      </div>
      {/* FIXME: we need to think about how to pass along terminals / locations */}
      <PlanNavigationList subnets={children} open={open}/>
    </li>
  )
}

const mapStateToProps = state => ({
  subnets: state.planEditor.subnets,
  // locationAlerts: PlanEditorSelectors.getAlertsForSubnetTree(state),
  // map: state.map.googleMaps,
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigationItem)
