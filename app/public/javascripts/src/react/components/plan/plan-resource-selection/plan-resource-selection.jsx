import React, { Component } from 'react'
import { connect } from 'react-redux'
import GlobalSettings from '../../global-settings/global-settings.jsx'
import PlanActions from '../plan-actions'
import ResourceActions from '../../resource-editor/resource-actions'

export class PlanResourceSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
      openResourceSelection: false,
      currentEditor: '',
      getResourceItemsArray: '',
      selectedResourceName: ''
    }

    this.props.loadPlanResourceSelectionFromServer(this.props.activePlan)
    this.handleChange = this.handleChange.bind(this)
  }

  // To set Props values to State if props get modified
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(nextProps, state) {
    if (nextProps.resourceItems !== undefined) {
      return {
        getResourceItemsArray : Object.values(nextProps.resourceItems),
        openResourceSelection: nextProps.isResourceSelection
      }
    } else {
      return null
    }
  }

  render () {
    return this.props.resourceItems === undefined || this.state.getResourceItemsArray === ''
      ? null
      : this.renderPlanResourceSelection()
  }

  renderPlanResourceSelection() {

    return (
      <div style={{position: 'relative', height: '100%'}}>
        <table className="table table-sm table-striped">
          <tbody>
          {this.state.getResourceItemsArray.map((resourceItem, resourceIndex) =>
            <tr key={resourceItem.id}>
              <td style={{verticalAlign: 'middle'}}>{resourceItem.description}</td>
              <td>
                <div style={{display: 'flex'}}>
                  <select
                    className="form-control"
                    style={{flex: '1 1 auto'}}
                    onChange={(event) => this.handleChange(event, resourceIndex)}
                    value={resourceItem.selectedManager !== null ? resourceItem.selectedManager.id : ''}
                  >
                    {resourceItem.allManagers.map((item) =>
                      <option key={item.id} value={item.id} label={item.name}></option>
                    )}
                  </select>
                  <button
                    className="btn btn-light"
                    style={{flex: '0 0 auto'}}
                    onClick={() => this.openResourceSelection(
                      resourceItem.allManagers[0].managerType, resourceItem.description
                    )}
                  >
                    <span className="fa fa-edit"></span>
                  </button>
                </div>
              </td>
            </tr>
          )}
          </tbody>
        </table>
        {this.state.openResourceSelection &&
          <GlobalSettings
            resourceEditorProps={this.state.currentEditor}
            currentViewProps='Resource Managers'
            selectedResourceNameProps={this.state.selectedResourceName}
          />
        }
      </div>
    )
  }

  handleChange(event, oldresourceIndex){

    const getResourceItemsArray = this.state.getResourceItemsArray
    getResourceItemsArray.map((resourceItem, resourceIndex) => {
      if (oldresourceIndex === resourceIndex)
        resourceItem.allManagers.map((item) => {
          if (parseInt(event.target.value) === parseInt(item.id)) {
            resourceItem.selectedManager = item
          }
        })
      }
    )
    this.setState({ getResourceItemsArray })
    this.props.onResourceSelectionChange({ childKey: 'resourceSelection', isValid: true })
  }

  getResourceItemsArray () {
    return Object.values(this.props.resourceItems)
  }

  openResourceSelection(currentEditor, selectedResourceName){
    this.setState({ currentEditor, selectedResourceName })
    this.props.setIsResourceSelection(true)
    this.props.setIsResourceEditor(true)
    this.props.searchManagers('')
  }
}

const mapStateToProps = (state) => ({
  activePlan: state.plan.activePlan,
  resourceItems: state.plan.resourceItems,
  isResourceSelection: state.plan.isResourceSelection,
})

const mapDispatchToProps = (dispatch) => ({
  loadPlanResourceSelectionFromServer: (plan) => dispatch(PlanActions.loadPlanResourceSelectionFromServer(plan)),
  setIsResourceSelection: (status) => dispatch(PlanActions.setIsResourceSelection(status)),
  searchManagers: (searchText) => dispatch(ResourceActions.searchManagers(searchText)),
  setIsResourceEditor: (isResourceEditor) => dispatch(ResourceActions.setIsResourceEditor(isResourceEditor)),
})

const PlanResourceSelectionComponent = connect(mapStateToProps, mapDispatchToProps)(PlanResourceSelection)
export default PlanResourceSelectionComponent
