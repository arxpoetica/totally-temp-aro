import React from 'react'
import { connect } from 'react-redux'
import { Button } from '@mantine/core'
import { IconDeviceFloppy } from '@tabler/icons'
import format from '../../../../../models/string-template'
import AroHttp from '../../../../common/aro-http'
import SelectionModes from '../../../selection/selection-modes'
import SelectionActions from '../../../selection/selection-actions'
import { Notifier } from '../../../../common/notifications'

function expertButton(props) {

  const {
    activePlan,
    expertMode,
    selectedExpertMode,
    expertModeTypes,
    reduxPlanTargets,
    expertModeScopeContext,
  } = props

  // expert mode refactor
  async function executeManualPlanTargetsQuery() {
    try {

      let data = []
      const isTargets = selectedExpertMode === expertModeTypes.MANUAL_PLAN_TARGET_ENTRY.id
      const planTargetsToAdd = { locations: new Set(), serviceAreas: new Set() }
      const planTargetsToRemove = { locations: new Set(), serviceAreas: new Set() }
      const expertQuery = format(expertMode[selectedExpertMode], expertModeScopeContext)

      if (isTargets) {
        await AroHttp.post(`/service/plan/selected_locations/cmd`, {
          cmdType: 'EXPERT_SET',
          expertQuery,
          planId: activePlan.id,
        })
        data = (await AroHttp.get(`/service/plan/${activePlan.id}/selected_locations`)).data
        props.setSelectionTypeById(SelectionModes.SELECTED_LOCATIONS)
      } else {
        // FIXME: legacy API call, transfer to service
        data = (await AroHttp.post('/network_plan/getIdsFromSql', { query: expertQuery })).data
        props.setSelectionTypeById(SelectionModes.SELECTED_AREAS)
      }

      const targetsType = isTargets ? 'locations' : 'serviceAreas'
      for (const id of data) {
        if (reduxPlanTargets[targetsType].has(id)) {
          planTargetsToRemove[targetsType].add(id)
        } else {
          planTargetsToAdd[targetsType].add(id)
        }
      }

      if (planTargetsToAdd.locations.size > 0 || planTargetsToAdd.serviceAreas.size > 0) {
        props.addPlanTargets(activePlan.id, planTargetsToAdd)
      }
      if (planTargetsToRemove.locations.size > 0 || planTargetsToRemove.serviceAreas.size > 0) {
        props.removePlanTargets(activePlan.id, planTargetsToRemove)
      }

    } catch (error) {
      Notifier.error(error)
    }
  }

  return (
    <div className="expert-button">
      <Button
        leftIcon={<IconDeviceFloppy size={20} stroke={2}/>}
        onClick={() => executeManualPlanTargetsQuery()}
        disabled={!expertModeTypes[selectedExpertMode].isQueryValid}
        fullWidth
      >
        Execute
      </Button>
      <style jsx>{`
        .expert-button { margin: 0 0 10px; }
      `}</style>
    </div>
  )
}

const mapStateToProps = (state) => ({
  expertMode: state.expertMode.expertMode,
  selectedExpertMode: state.expertMode.selectedExpertMode,
  expertModeTypes: state.expertMode.expertModeTypes,
  expertModeScopeContext: state.expertMode.expertModeScopeContext,
  reduxPlanTargets: state.selection.planTargets,
  activePlan: state.plan.activePlan,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectionTypeById: (selectionTypeId) => dispatch(SelectionActions.setActiveSelectionMode(selectionTypeId)),
  addPlanTargets: (planId, planTargets) => dispatch(SelectionActions.addPlanTargets(planId, planTargets)),
  removePlanTargets: (planId, planTargets) => dispatch(SelectionActions.removePlanTargets(planId, planTargets)),
})

export const ExpertModeButton = connect(mapStateToProps, mapDispatchToProps)(expertButton)
