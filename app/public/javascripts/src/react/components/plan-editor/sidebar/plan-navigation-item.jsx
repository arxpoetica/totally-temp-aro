import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'
import { constants } from '../shared'
import cx from 'clsx'
const { ALERT_TYPES, Z_INDEX_PIN } = constants

// FIXME: will draw most props from state
const PlanNavigationItem = ({ subnet }) => {

  const [open, setOpen] = useState(true)

  return (
    <li className="item">
      <div className="header">
        <span className="svg plus-minus"></span>
        <h2>{subnet.subnetNode}</h2>
        <span className="svg warning"></span>
      </div>
      {/* FIXME: we need to think about how to pass along terminals / locations */}
      <PlanNavigationList subnet={subnet}/>
    </li>
  )
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigationItem)
