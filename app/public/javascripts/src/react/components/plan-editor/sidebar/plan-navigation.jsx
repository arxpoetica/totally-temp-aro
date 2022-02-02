import React from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'
import PlanEditorSelectors from '../plan-editor-selectors.js'

const PlanNavigation = ({ rootSubnet }) => {
  return rootSubnet ? (
    <div className="plan-navigation">
      <PlanNavigationList subnet={rootSubnet}/>
    </div>
  ) : null
}

const mapStateToProps = state => ({
  rootSubnet: PlanEditorSelectors.getRootSubnet(state),
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation)
