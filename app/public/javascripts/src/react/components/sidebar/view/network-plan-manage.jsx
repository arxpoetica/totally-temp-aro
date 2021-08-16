import React, { useState } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import PlanInfo from './plan-info.jsx'
import PlanSearch from '../../header/plan-search.jsx'

export const NetworkPlanManage = () => {

  const views = Object.freeze({
    Plan_Info: 0,
    Search_plans: 1,
  })

  const [state, setState] = useState({
    currentView: views.Search_plans,
  })

  const { currentView } = state

  const setCurrentView = (currentView) => {
    setState((state) => ({ ...state, currentView }))
  }

  return (
    <div className="aro-plan-info-container">
      <ul className="nav nav-tabs">
        <li role="presentation" className="nav-item" onClick={() => setCurrentView(views.Plan_Info)}>
          <a href="#" className={`nav-link ${currentView === views.Plan_Info ? 'active' : ''}`}>Plan Info</a>
        </li>
        <li role="presentation" className="nav-item" onClick={() => setCurrentView(views.Search_plans)}>
          <a href="#" className={`nav-link ${currentView === views.Search_plans ? 'active' : ''}`}>Search Plans</a>
        </li>
      </ul>

      {currentView === views.Plan_Info &&
        <PlanInfo />
      }

      {currentView === views.Search_plans &&
        <PlanSearch
          currentView='viewModePlanSearch'
          showPlanDeleteButton={true}
        />
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = (dispatch) => ({
})

export default wrapComponentWithProvider(reduxStore, NetworkPlanManage, mapStateToProps, mapDispatchToProps)
