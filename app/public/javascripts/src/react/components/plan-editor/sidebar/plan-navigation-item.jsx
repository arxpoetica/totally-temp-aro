import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'
import PlanEditorSelectors from '../plan-editor-selectors'
import { constants } from '../shared'
import cx from 'clsx'
const { ALERT_TYPES, Z_INDEX_PIN } = constants

// FIXME: will draw most props from state
const PlanNavigationItem = ({ title, depth = 0 }) => {

  const [open, setOpen] = useState(true)

  return (
    <li className="item">
      <div className="header">
        <span className="svg plus-minus"></span>
        <span className="svg warning"></span>
        <h2>{title}</h2>
      </div>
      {depth < 4 && <>
        <PlanNavigationList depth={depth + 1}/>
      </>}
    </li>
  )
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigationItem)
