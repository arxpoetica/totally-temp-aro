import React, { Component } from 'react'
import { connect } from 'react-redux'
import NetworkOptimizationActions from '../../../optimization/network-optimization/network-optimization-actions'
import format from '../../../../../models/string-template'
import AroHttp from '../../../../common/aro-http'
import SelectionModes from '../../../selection/selection-modes'
import SelectionActions from '../../../selection/selection-actions'

export class expertButton extends Component {

  render () {

    const { networkAnalysisType, selectedExpertMode, expertModeTypes } = this.props

    return (
      <div>
        {networkAnalysisType === 'EXPERT_MODE' && selectedExpertMode === expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
          <button className="btn btn-block btn-primary" onClick={() => this.saveExpertMode()}>
            <i className="fa fa-save"></i>
            &nbsp;Save
          </button>
        }

        {networkAnalysisType === 'EXPERT_MODE' && selectedExpertMode !== expertModeTypes['OPTIMIZATION_SETTINGS'].id &&
          <button
            type='button'
            className={`btn btn-block ${!expertModeTypes[selectedExpertMode].isQueryValid ? 'btn-default' : 'btn-primary'}`}
            disabled={!expertModeTypes[selectedExpertMode].isQueryValid}
            onClick={() => this.executeManualPlanTargetsQuery()}
          >
            <i className="fa fa-save" />
            &nbsp;Execute
          </button>
        }

        <div style={{width: '100%', paddingBottom: '20px'}} />
      </div>
    )
  }

  saveExpertMode () {
    this.props.setOptimizationInputs(JSON.parse(this.props.expertMode.OPTIMIZATION_SETTINGS))
  }

  // expert mode refactor
  executeManualPlanTargetsQuery () {
    const query = this.formatExpertModeQuery(
      this.props.expertMode[this.props.selectedExpertMode], this.props.expertModeScopeContext
    )

    AroHttp.post('/locations/getLocationIds', { query })
      .then((result) => {

        const { plan, selectedExpertMode, expertModeTypes, reduxPlanTargets } = this.props

        if (selectedExpertMode === expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id) {
          this.props.setSelectionTypeById(SelectionModes.SELECTED_LOCATIONS)
        } else {
          this.props.setSelectionTypeById(SelectionModes.SELECTED_AREAS)
        }

        const addPlanTargets = { locations: new Set(), serviceAreas: new Set() }
        const removePlanTargets = { locations: new Set(), serviceAreas: new Set() }
        if (selectedExpertMode === expertModeTypes['MANUAL_PLAN_TARGET_ENTRY'].id) {
          result.data.forEach((location) => {
            if (reduxPlanTargets.locations.has(+location)) {
              removePlanTargets.locations.add(+location)
            } else {
              addPlanTargets.locations.add(+location)
            }
          })
        } else {
          result.data.forEach((serviceAreaId) => {
            if (reduxPlanTargets.serviceAreas.has(+serviceAreaId)) {
              removePlanTargets.serviceAreas.add(+serviceAreaId)
            } else {
              addPlanTargets.serviceAreas.add(+serviceAreaId)
            }
          })
        }

        if (addPlanTargets.locations.size > 0 || addPlanTargets.serviceAreas.size > 0) {
          this.props.addPlanTargets(plan.id, addPlanTargets)
        }
        if (removePlanTargets.locations.size > 0 || removePlanTargets.serviceAreas.size > 0) {
          this.props.removePlanTargets(plan.id, removePlanTargets)
        }
      })
      .catch(err => console.log(err))
  }

  formatExpertModeQuery (string, replaceWithobject) {
    const query = format(string, replaceWithobject)
    return query
  }
}

const mapStateToProps = (state) => ({
  networkAnalysisType: state.optimization.networkOptimization.optimizationInputs.analysis_type,
  expertMode: state.expertMode.expertMode,
  selectedExpertMode: state.expertMode.selectedExpertMode,
  expertModeTypes: state.expertMode.expertModeTypes,
  expertModeScopeContext: state.expertMode.expertModeScopeContext,
  reduxPlanTargets: state.selection.planTargets,
  plan: state.plan.activePlan,
})

const mapDispatchToProps = (dispatch) => ({
  setOptimizationInputs: (inputs) => dispatch(NetworkOptimizationActions.setOptimizationInputs(inputs)),
  setSelectionTypeById: (selectionTypeId) => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
  addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
  removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets)),
})

const expertButtonComponent = connect(mapStateToProps, mapDispatchToProps)(expertButton)
export default expertButtonComponent
