import React from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'
import PlanEditorSelectors from '../plan-editor-selectors.js'

const PlanNavigation = ({ rootSubnet }) => {
  return (
    <div className="plan-navigation">
      <PlanNavigationList subnet={rootSubnet}/>
    </div>
  )
}

const mapStateToProps = state => ({
  rootSubnet: PlanEditorSelectors.getRootSubnet(state),
  // googleMaps: state.map.googleMaps,
  // subnets: state.planEditor.subnets,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation)
