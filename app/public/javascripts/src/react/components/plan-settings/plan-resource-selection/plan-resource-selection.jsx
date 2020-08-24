import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import GlobalSettings from '../../global-settings/global-settings.jsx'
import PlanActions from '../../plan/plan-actions'

export class PlanResourceSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
      openResourceSelection:false,
      currentEditor: '',
      getResourceItemsArray: []
    }

    this.props.loadPlanResourceSelectionFromServer(this.props.activePlan)
  }

  render () {
    return this.props.resourceItems === undefined
      ? null
      : this.renderPlanResourceSelection()
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      if(nextProps.resourceItems !== undefined) {
        this.setState({getResourceItemsArray: Object.values(nextProps.resourceItems),
          openResourceSelection: nextProps.isResourceSelection })
      }
    }
  }

  renderPlanResourceSelection() {

    return (
      <div style={{position: 'relative', height: '100%'}}>
        <table className="table table-sm table-striped">
          <tbody>
          {this.state.getResourceItemsArray.map((resourceItem, resourceIndex) =>
            <tr key={resourceIndex}>
              <td style={{verticalAlign: 'middle'}}>{resourceItem.description}</td>
              <td>
                <div style={{display:'flex'}}>
                  <select className="form-control" style={{flex: '1 1 auto'}} onChange={(e)=>this.handleChange(e)} value={resourceItem.selectedManager}>
                    {resourceItem.allManagers.map((item, index) =>
                      <option key={index} value={item.name} label={item.name}></option>
                    )}
                  </select>
                  <button className="btn btn-light" style={{flex: '0 0 auto'}} onClick={(e)=>this.openResourceSelection(resourceItem.allManagers[0].managerType)}>
                    <span className="fa fa-edit"></span>
                  </button>
                </div>
              </td>
            </tr>
          )}           
          </tbody>
        </table>
        {this.state.openResourceSelection &&
          <GlobalSettings currentEditorProps={this.state.currentEditor} currentViewProps='Resource Managers'/>
        }
      </div>

    )
  }

  handleChange(e){
    console.log(e)
  }

  getResourceItemsArray () {
    return Object.values(this.props.resourceItems)
  }
  
  openResourceSelection(currentEditor){
    this.setState({currentEditor:currentEditor});
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
