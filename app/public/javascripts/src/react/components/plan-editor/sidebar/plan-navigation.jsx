import React from 'react'
import { connect } from 'react-redux'
import PlanNavigationList from './plan-navigation-list.jsx'

const PlanNavigation = props => {

  return (
    <div className="plan-navigation">

      <PlanNavigationList title="Central Office"/>

    </div>
  )

}

const mapStateToProps = state => ({})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanNavigation)
