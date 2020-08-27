import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './plan-settings.css';
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap';
import PlanResourceSelection from './plan-resource-selection/plan-resource-selection.jsx'
import PlanDataSelection from './plan-data-selection/plan-data-selection.jsx'
import PlanProjectConfig from './plan-project-configuration/plan-project-configuration.jsx'
import PlanActions from './plan-actions'


export class PlanSettings extends Component {
  constructor (props) {
    super(props)
    this.state = {
      collapseCards: 'DATA_SELECTION',
      isSaveEnabled: false,
      errorText: ''
    }

    this.childSettingsPanels = {}
    this.resetChildSettingsPanels()
    this.onResourceSelectionChange = this.onResourceSelectionChange.bind(this);
    this.onDataSelectionChange = this.onDataSelectionChange.bind(this);
  }

  componentDidMount(){
    this.childSettingsPanels.resourceSelection.isChanged = (JSON.stringify(this.props.resourceItems) !== JSON.stringify(this.props.pristineResourceItems))
    this.updateUIState()
  }
  

  render () {
    return this.renderPlanSettings()
  }

  renderPlanSettings() {

    const {collapseCards, isSaveEnabled, errorText} = this.state;

    return (
      <div className="plan-settings-container">
  
        {/* Buttons to commit or discard a transaction */}
        <div className="text-center">
          <div className="btn-group ">
            <button className="btn btn-light mr-1" disabled={!isSaveEnabled} onClick={(e)=>this.saveChanges()}><i className="fa fa-check-circle"></i>&nbsp;&nbsp;Commit</button>
            <button className="btn btn-light" disabled={!isSaveEnabled} onClick={(e)=>this.discardChanges()}><i className="fa fa-times-circle"></i>&nbsp;&nbsp;Discard</button>
          </div>
          <div className="plan-settings-error-contain"> 
            {'' != errorText &&
              <div className="alert-danger plan-settings-error-message">{errorText}</div> 
            }
          </div>
        </div>

        <Card className={`card-collapse ${collapseCards === 'DATA_SELECTION' ? 'collapse-show' :''}`}>
          <CardHeader className={`card-header-dark ${collapseCards === 'DATA_SELECTION' ? 'card-fixed' :''}`} onClick={(e)=>this.toggleCards(e)} data-event='DATA_SELECTION'>Data Selection</CardHeader>
          <Collapse isOpen={collapseCards === 'DATA_SELECTION'}>
            <CardBody style={{padding:'0px'}}>
              <PlanDataSelection
                onDataSelectionChange={this.onDataSelectionChange}
              />
            </CardBody>
          </Collapse>
        </Card>

        <Card className={`card-collapse ${collapseCards === 'RESOURCE_SELECTION' ? 'collapse-show' :''}`}>
          <CardHeader className={`card-header-dark ${collapseCards === 'RESOURCE_SELECTION' ? 'card-fixed' :''}`} onClick={(e)=>this.toggleCards(e)} data-event='RESOURCE_SELECTION'>Resource Selection</CardHeader>
          <Collapse isOpen={collapseCards === 'RESOURCE_SELECTION'}>
            <CardBody style={{padding:'0px'}}>
              <PlanResourceSelection
               onResourceSelectionChange={this.onResourceSelectionChange}
              />
            </CardBody>
          </Collapse>
        </Card>

        <Card className={`card-collapse ${collapseCards === 'PROJECT_CONFIGURATION' ? 'collapse-show' :''}`}>
          <CardHeader className={`card-header-dark ${collapseCards === 'PROJECT_CONFIGURATION' ? 'card-fixed' :''}`} onClick={(e)=>this.toggleCards(e)} data-event='PROJECT_CONFIGURATION'>Project Configuration</CardHeader>
          <Collapse isOpen={collapseCards === 'PROJECT_CONFIGURATION'}>
            <CardBody style={{padding:'0px'}}>
              <PlanProjectConfig/>
            </CardBody>
          </Collapse>
        </Card>
      </div>
    )
  }

  toggleCards(e) {
    let event = e.target.dataset.event;
    this.setState({ collapseCards: this.state.collapseCards === event ? 'DATA_SELECTION' : event });
  }

  resetChildSettingsPanels (childKey) {
    if (typeof childKey === 'undefined') {
      // if no child key, reset all
      this.childSettingsPanels = {
        resourceSelection: {
          displayName: 'Resource Selection',
          isChanged: false,
          isValid: true
        }
      }
    } else {
      // if child key, reset only that one
      if (!this.childSettingsPanels.hasOwnProperty(childKey)) return
      this.childSettingsPanels[childKey].isChanged = false
      this.childSettingsPanels[childKey].isValid = true
    }
  }

  onDataSelectionChange (args) {
    //this.props.setHaveDataItemsChanged(true)
    // Update the isDataSelectionValid state manually
    this.isDataSelectionValid = args.isValid
    this.updateUIState()
  }

  onResourceSelectionChange (args) {
    if (!args.hasOwnProperty('childKey')) return
    var childKey = args.childKey
    var isValid = true
    if (args.hasOwnProperty('isValid')) isValid = args.isValid
    var isInit = false
    if (args.hasOwnProperty('isInit')) isInit = args.isInit

    if (this.childSettingsPanels.hasOwnProperty(childKey)) {
      if (!isInit) this.childSettingsPanels[childKey].isChanged = true
      this.childSettingsPanels[childKey].isValid = isValid

      this.updateUIState()
    }
  }

  updateUIState () {
    // update buttons and error list
    var childData = this.getChangeList()
    this.setState({isSaveEnabled: (childData.changesList.length > 0)});

    if (childData.invalidList.length > 0) {
      this.setState({isSaveEnabled: false});
      var errorText = this.childListToText(childData.invalidList)
      this.setState({errorText: 'Invalid selections for ' + errorText + '.'});
    } else {
      this.setState({errorText: ''});
    }
  }

  saveChanges () {
    if (!this.state.isSaveEnabled) return
    this.setState({isSaveEnabled: false});
    // for each child save and on success rest the object
    if (this.props.haveDataItemsChanged && this.isDataSelectionValid) {
      this.props.saveDataSelectionToServer(this.props.activePlan, this.props.dataItems)
      this.props.setHaveDataItemsChanged(false)
      this.props.clearAllSelectedSA(this.props.activePlan, this.props.dataItems, this.props.selectedServiceAreas)
    }

    if (this.childSettingsPanels.resourceSelection.isChanged && this.childSettingsPanels.resourceSelection.isValid) {
      this.props.savePlanResourceSelectionToServer(this.props.activePlan, this.props.resourceItems)
      this.resetChildSettingsPanels('resourceSelection')
    }
  }

  discardChanges(){
    this.setState({isSaveEnabled: false});
    this.resetChildSettingsPanels()

    this.props.loadPlanResourceSelectionFromServer(this.props.activePlan)
  }

  getChangeList () {
    var changesList = []
    var invalidList = []

    for (var childKey in this.childSettingsPanels) {
      if (this.childSettingsPanels[childKey].isChanged) changesList.push(this.childSettingsPanels[childKey])
      if (!this.childSettingsPanels[childKey].isValid) invalidList.push(this.childSettingsPanels[childKey])
    }
    // Just follow this same pattern for data selection, even if the code is convoluted.
    const dataItemsMeta = {
      displayName: 'Data Selection',
      isValid: this.isDataSelectionValid,
      isChanged: this.props.haveDataItemsChanged
    }
    if (this.props.haveDataItemsChanged) {
      changesList.push(dataItemsMeta)
    }
    if (!this.isDataSelectionValid) {
      invalidList.push(dataItemsMeta)
    }

    return { changesList: changesList, invalidList: invalidList }
  }

  childListToText (list) {
    var text = ''
    for (var i = 0; i < list.length; i++) {
      if (i != 0 && list.length > 2) text += ', '
      if (list.length > 1 && list.length - 1 == i) text += ' and '
      text += list[i].displayName
    }

    return text
  }

  componentWillUnmount() {
       // If any selections have been changed, ask the user if they want to save them

       var childData = this.getChangeList()

       var changesList = childData.changesList
       var invalidList = childData.invalidList
   
       if (changesList.length > 0) {
         if (invalidList.length == 0) {
           var saveText = this.childListToText(changesList)
   
           swal({
             title: 'Save modified settings?',
             text: 'Do you want to save your changes to ' + saveText + '?',
             type: 'warning',
             confirmButtonColor: '#DD6B55',
             confirmButtonText: 'Save', // 'Yes',
             showCancelButton: true,
             cancelButtonText: 'Keep Unsaved', // 'No',
             closeOnConfirm: true
           }, (result) => {
             if (result) {
               this.saveChanges()
             } else {
               // this.discardChanges()
             }
           })
         } else {
           // All selections are not valid
           var errorText = this.childListToText(invalidList)
           swal({
             title: 'Invalid selections',
             text: 'The data selections are not valid for ' + errorText + '. Correct them before trying to save your changes.',
             type: 'error',
             showCancelButton: false,
             confirmButtonColor: '#DD6B55'
           })
         }
       }
  }

}

  const mapStateToProps = (state) => ({
    resourceItems: state.plan.resourceItems,
    dataItems: state.plan.dataItems,
    pristineResourceItems: state.plan.pristineResourceItems,
    haveDataItemsChanged: state.plan.haveDataItemsChanged,
    activePlan: state.plan.activePlan,
    selectedServiceAreas: state.selection.planTargets.serviceAreas

  })   

  const mapDispatchToProps = (dispatch) => ({
    loadPlanResourceSelectionFromServer: (plan) => dispatch(PlanActions.loadPlanResourceSelectionFromServer(plan)),
    saveDataSelectionToServer: (plan, dataItems) => dispatch(PlanActions.saveDataSelectionToServer(plan, dataItems)),
    setHaveDataItemsChanged: haveDataItemsChanged => dispatch(PlanActions.setHaveDataItemsChanged(haveDataItemsChanged)),
    clearAllSelectedSA: (plan, dataItems, selectedServiceAreas) => dispatch(PlanActions.clearAllSelectedSA(plan, dataItems, selectedServiceAreas)),
    savePlanResourceSelectionToServer: (plan, resourceItems) => dispatch(PlanActions.savePlanResourceSelectionToServer(plan, resourceItems)),

  })

  const PlanSettingsComponent = wrapComponentWithProvider(reduxStore, PlanSettings, mapStateToProps, mapDispatchToProps)
  export default PlanSettingsComponent
