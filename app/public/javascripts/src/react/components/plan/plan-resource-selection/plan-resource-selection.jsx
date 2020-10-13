import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import GlobalSettings from '../../global-settings/global-settings.jsx'
import PlanActions from '../plan-actions'

export class PlanResourceSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
      openResourceSelection:false,
      currentEditor: '',
      getResourceItemsArray: '',
      selectedResourceName: ''
    }

    this.props.loadPlanResourceSelectionFromServer(this.props.activePlan)
    this.handleChange = this.handleChange.bind(this);
  }

  render () {
    return this.props.resourceItems === undefined
      ? null
      : this.renderPlanResourceSelection()
  }

  // To set Props values to State if props get modified
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(nextProps, state) {
    if(nextProps.resourceItems !== undefined) {
      return {
        getResourceItemsArray : Object.values(nextProps.resourceItems),
        openResourceSelection: nextProps.isResourceSelection
      }
    } else return null
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
                <div style={{display:'flex'}}>
                  <select className="form-control" style={{flex: '1 1 auto'}} onChange={(e)=>this.handleChange(e,resourceIndex)} value={resourceItem.selectedManager !== null ? resourceItem.selectedManager.id : ''}>
                    {resourceItem.allManagers.map((item, index) =>
                      <option key={item.id} value={item.id} label={item.name}></option>
                    )}
                  </select>
                  <button className="btn btn-light" style={{flex: '0 0 auto'}} onClick={(e)=>this.openResourceSelection(resourceItem.allManagers[0].managerType, resourceItem.description)}>
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

  handleChange(e, oldresourceIndex){

    var getResourceItemsArray = this.state.getResourceItemsArray
    getResourceItemsArray.map((resourceItem, resourceIndex) => {
      if(oldresourceIndex === resourceIndex)
        resourceItem.allManagers.map((item, index) => {
          if(parseInt(e.target.value) === parseInt(item.id)){
            resourceItem.selectedManager = item
          }
        })
      }
    )
    this.setState({getResourceItemsArray: getResourceItemsArray});
    this.props.onResourceSelectionChange({ childKey: 'resourceSelection', isValid: true })
  }

  getResourceItemsArray () {
    return Object.values(this.props.resourceItems)
  }
  
  openResourceSelection(currentEditor, selectedResourceName){
    this.setState({currentEditor:currentEditor, selectedResourceName: selectedResourceName});
    this.props.setIsResourceSelection(true)
  }
}

  const mapStateToProps = (state) => ({
    activePlan: state.plan.activePlan,
    resourceItems: state.plan.resourceItems,
    isResourceSelection: state.plan.isResourceSelection
  })   

  const mapDispatchToProps = (dispatch) => ({
    loadPlanResourceSelectionFromServer: (plan) => dispatch(PlanActions.loadPlanResourceSelectionFromServer(plan)),
    setIsResourceSelection: (status) => dispatch(PlanActions.setIsResourceSelection(status))

  })

   const PlanResourceSelectionComponent = wrapComponentWithProvider(reduxStore, PlanResourceSelection, mapStateToProps, mapDispatchToProps)
   export default PlanResourceSelectionComponent
