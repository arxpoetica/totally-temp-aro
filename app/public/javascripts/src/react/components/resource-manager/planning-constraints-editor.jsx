import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { getFormValues } from 'redux-form'
import PlanningConstraints from './planning-constraints-form.jsx'
import Constants from '../../common/constants'
import ResourceManagerActions from './resource-manager-actions'
import ResourceActions from '../resource-editor/resource-actions'
import AroHttp from '../../common/aro-http'
import { Notifier } from '../../common/notifications.js'
const planningConstraintsSelector = getFormValues(Constants.PLANNING_CONSTRAINTS_FORM)


export const PlanningConstraintsEditor = (props) => {
  const [cableSizeList, setCableSizeList] = useState([])

  useEffect(() => {
    props.setModalTitle(props.resourceManagerName)
    getCableSizesFromPricebook()
  }, [])

  const getCableSizesFromPricebook = async () => {
    try {
      const pricebook = props.resourceManagers.find(
        (manager) => manager.resourceType === 'price_book',
      )
      if (!pricebook) return

      const { data } = await AroHttp.get(
        `/service/v1/pricebook/${pricebook.id}/definition`,
      )

      const { fiberCableList } = data

      // extract strings from list, and filter 'generic' as that shouldn't be selectable
      const formattedCableSizes = fiberCableList
        .filter((cable) => cable.name !== 'generic')
        .map((cableSize) => cableSize.name)

      setCableSizeList(formattedCableSizes)
    } catch (error) {
      Notifier.error(error)
    }
  }

  const saveSettings =  () => {
    props.saveResourceManagerDefinition(props.editingManager.id, props.editingManager.type, props.modifiedPlanningConstraints)
    props.onDiscard()
  }

  return (
    <div>
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{flex: '1 1 auto'}}>
            <PlanningConstraints initialValues={props.definition} cableSizeList={cableSizeList} enableReinitialize />
          </div>
          <div style={{flex: '0 0 auto'}}>
            <div style={{textAlign: 'right'}}>
              <button className='btn btn-light mr-2' onClick={() => props.onDiscard()}>
                <i className="fa fa-undo action-button-icon"></i>Discard changes
              </button>
              <button className='btn btn-primary' onClick={() => saveSettings()}>
                <i className="fa fa-save action-button-icon"></i>Save
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}

const mapStateToProps = state => ({
  editingManager: state.resourceManager.editingManager,
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  definition: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].definition,
  modifiedPlanningConstraints: planningConstraintsSelector(state),
  resourceManagers: state.resourceEditor.resourceManagers,
})

const mapDispatchToProps = dispatch => ({
  saveResourceManagerDefinition: (resourceManagerId, managerType, definition) => dispatch(ResourceManagerActions.saveResourceManagerDefinition(resourceManagerId, managerType, definition)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
})


export default connect(mapStateToProps, mapDispatchToProps)(PlanningConstraintsEditor)
