import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import GlobalSettings from '../../global-settings/global-settings.jsx'
import PlanActions from '../plan-actions'
import ToolBarActions from '../../header/tool-bar-actions'
import Select, { components } from "react-select"
import createClass from "create-react-class"

const styles = {
  container: base => ({
    ...base,
    flex: 1,
    width: 132,
  })
}

export class PlanDataSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
      openDataSelection: false,
      dataSelectionName: '',
      dataItems: '',
    }

    this.isDataSourceEditable = {},
    this.sales_role_remove = ['cable_construction_area', 'construction_location', 'edge', 'construction_location', 'tile_system', 'construction_area']
  }

  componentDidMount(){
    // To validate DataSource in OnLoad
    this.updateSelectionValidation()
    Object.keys(this.props.dataItems).forEach(dataSourceKey => {
      this.isDataSourceEditable[dataSourceKey] = false
      this.props.updateDataSourceEditableStatus(this.isDataSourceEditable,dataSourceKey,this.props.loggedInUser, this.props.authPermissions, this.props.dataItems)
    })
    var isValid = this.areAllSelectionsValid()
    this.props.onDataSelectionChange({ childKey: 'dataSelection', isValid: isValid, isInit: true })
  }

  componentDidUpdate(prevProps) {
    // Trigger updateSelectionValidation() if props change
    if(this.props.dataItems != prevProps.dataItems) {
      this.updateSelectionValidation()
    }
  }

  // To set Props values to State if props get modified
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(nextProps, state) {
    if(nextProps.dataItems !== undefined) {
      return {
        openDataSelection : nextProps.isDataSelection,
        dataItems: nextProps.dataItems
      }
    }
  }

  render () {
    return this.props.dataItems === undefined
      ? null
      : this.renderPlanDataSelection()
  }

  renderPlanDataSelection() {

    // Dataitems Objects needed to be converted to Array for Sorting
    let dataItemsArray = []
    Object.entries(this.state.dataItems).map(([ key, value ], objIndex) => {
      // To push only the visible values to dataItemsArray array
      if(value.visibility === true) {
        value.dataItemsKey = key // To create a 'dataItemsKey' key for new array
        dataItemsArray.push(value)
      }
    })

    // sort dataItems based on rankIndex
    let sorted_dataItems = dataItemsArray.sort((a, b) => parseFloat(b.rankIndex) - parseFloat(a.rankIndex))

    return (
      <div style={{position: 'relative', height: '100%'}}>
        <table className="table table-sm table-striped">
          <tbody>
            {sorted_dataItems.map((objValue, objIndex) => {

              let objKey = objValue.dataItemsKey

              let optionsList = []; let defaultList=[]
              if(objValue.allLibraryItems.length > 0){
                optionsList = objValue.allLibraryItems.map(function(newkey, index) {
                  return {"id":newkey.identifier, "value": newkey.name, "label": newkey.name}
                })
              }

              if(objValue.selectedLibraryItems.length > 0){
                defaultList = objValue.selectedLibraryItems.map(function(newkey, index) { 
                  return {"id":newkey.identifier, "value": newkey.name, "label": newkey.name}
                })
              }

              return (
                <React.Fragment key={objValue.id}>
                {!objValue.hidden &&
                  <tr style={{verticalAlign: 'middle'}}>
                    <td>{objValue.description}</td>
                    <td>
                      <div style={{display:'flex'}}>
                        <Select
                          defaultValue={defaultList}
                          closeMenuOnSelect={false}
                          isMulti
                          components={{ Option }}
                          options={optionsList}
                          hideSelectedOptions={false}
                          backspaceRemovesValue={false}
                          isSearchable={true} 
                          isClearable=''
                          isDisabled=''
                          placeholder="None Selected"
                          onChange={(e,id)=>this.onSelectionChanged(e, objValue.id, objKey)}
                          styles={styles}
                        />
                        <div className="btn-group btn-group-sm" style={{flex: '0 0 auto'}}>
                          {this.props.isDataSourceEditable[objKey] &&
                            <button className="btn btn-light" onClick={(e)=>this.editDataSource(objKey)} >
                              <span className="fa fa-edit"></span>
                            </button>
                          }
                          <button className="btn btn-light" disabled={!objValue.uploadSupported} onClick={(e)=>this.openDataSelection(objValue.id)}>
                            <span className="fa fa-upload"></span>
                          </button>
                        </div>
                      </div>
                      {!objValue.isMinValueSelectionValid &&
                        <span className="label label-danger alert-danger" style={{padding: '0px 10px'}}>Error: At least {objValue.minValue} items must be selected</span>
                      }
                      {!objValue.isMaxValueSelectionValid &&
                        <span className="label label-danger alert-danger" style={{padding: '0px 10px'}}>Error: A maximum of {objValue.maxValue} items can be selected</span>
                      }
                    </td>
                  </tr>
                }
                </React.Fragment>
              )}
            )}
          </tbody>
        </table>
        {this.state.openDataSelection &&
          <GlobalSettings 
            dataUploadProps={this.state.dataSelectionName}
            dataSelectionID={this.state.dataSelectionID}
            currentViewProps='Upload Data Resources'
          />
        }
      </div>
    )
  }

  onSelectionChanged(selectedLibraryItems, objId, dataSource){

    var dataItems = this.state.dataItems
    {Object.entries(dataItems).map(([ objKey, objValue ], objIndex) => {
      if(objId === objValue.id){
        objValue.selectedLibraryItems = []
        objValue.allLibraryItems.map(function(allItemKey) {
          if(selectedLibraryItems !== null) {
            selectedLibraryItems.map(function(selectedNewkey) {
              if(parseInt(selectedNewkey.id) === parseInt(allItemKey.identifier)){
                objValue.selectedLibraryItems.push(allItemKey)
              }
            })
          } else {
            objValue.selectedLibraryItems = []
          }
        })
      }
      })
    }
    this.updateSelectionValidation()
    this.props.selectDataItems(dataSource, this.state.dataItems[dataSource].selectedLibraryItems.map(item => JSON.parse(angular.toJson(item))))
    this.props.updateDataSourceEditableStatus(this.isDataSourceEditable, dataSource, this.props.loggedInUser, this.props.authPermissions, this.state.dataItems)
    var isValid = this.areAllSelectionsValid()
    setTimeout(function() {
      this.props.onDataSelectionChange({ childKey: 'dataSelection', isValid: isValid })
    }.bind(this),0)
  }

  // Updates the 'valid' flags for all data items
  updateSelectionValidation () {

    var dataItem = []
    Object.keys(this.state.dataItems).forEach((dataItemKey) => {
      if (this.props.loggedInUser.perspective === 'sales' && this.sales_role_remove.indexOf(dataItemKey) !== -1) {
        this.state.dataItems[dataItemKey].hidden = true
      }

      if(this.props.showPlanDataSelection !== undefined) {
        if(Object.entries(this.props.showPlanDataSelection).length > 0) {
        // To check Whether showPlanDataSelection has the required dataItemKey
          if(this.props.showPlanDataSelection.hasOwnProperty(dataItemKey)){
            // Add visibility and rankIndex to dataItem
            this.state.dataItems[dataItemKey].visibility = this.props.showPlanDataSelection[dataItemKey].visibility 
            this.state.dataItems[dataItemKey].rankIndex = this.props.showPlanDataSelection[dataItemKey].rankIndex
          } else {
            this.state.dataItems[dataItemKey].visibility = false
            this.state.dataItems[dataItemKey].rankIndex = 0
          }
        } else {
          this.alertDataSlection()
        }
      } else {
        this.alertDataSlection()
      }

      // To validate selection only for the visible items
      dataItem = this.state.dataItems[dataItemKey]
      if(dataItem.visibility === true) {
        dataItem.isMinValueSelectionValid = dataItem.selectedLibraryItems.length >= dataItem.minValue
        dataItem.isMaxValueSelectionValid = dataItem.selectedLibraryItems.length <= dataItem.maxValue
      }
    })
    this.setState({dataItems: this.state.dataItems})
  }

  alertDataSlection () {
    swal({
      title: '',
      text: 'Plan Data Selection "Settings" is Empty',
      type: 'warning'
    })
  }

  areAllSelectionsValid () {
    var areAllSelectionsValid = true
    Object.keys(this.state.dataItems).forEach((dataItemKey) => {
      var dataItem = this.state.dataItems[dataItemKey]
      if (!dataItem.isMinValueSelectionValid || !dataItem.isMaxValueSelectionValid) {
        areAllSelectionsValid = false
      }
    })
    return areAllSelectionsValid
  }

  editDataSource (itemKey) {
    itemKey === 'location' && this.editLocations()
    itemKey === 'service_layer' && this.editServiceLayer()
  }
  
  editLocations () { 
    // Put the application in "Edit Location" mode 
    this.props.selectedDisplayMode("VIEW")
    this.props.activeViewModePanel("EDIT_LOCATIONS")
  } 
  
  editServiceLayer () { 
    // Put the application in "Edit Service Layer" mode 
    this.props.selectedDisplayMode("VIEW")
    this.props.activeViewModePanel("EDIT_SERVICE_LAYER")
  }

  openDataSelection(srcId){

    this.props.uploadDataSources.forEach((value) => {
      if (value.id == srcId) {
        this.setState({dataSelectionName:value.name, dataSelectionID:value.id})
      }
    })
    this.props.setIsDataSelection(true)
  }
}

  const Option = createClass({
    render() {
      return (
        <div>
          <components.Option {...this.props}>
            <input
              type="checkbox"
              checked={this.props.isSelected}
              onChange={e => null}
            />{" "}
            <label>{this.props.value} </label>
          </components.Option>
        </div>
      )
    }
  })

  const mapStateToProps = (state) => ({
    dataItems: state.plan.dataItems,
    uploadDataSources: state.plan.uploadDataSources,
    isDataSelection: state.plan.isDataSelection,
    loggedInUser: state.user.loggedInUser,
    authPermissions: state.user.authPermissions,
    isDataSourceEditable: state.plan.isDataSourceEditable,
    showPlanDataSelection : state.toolbar.appConfiguration.showPlanDataSelection
  })   

  const mapDispatchToProps = (dispatch) => ({
    setIsDataSelection: (status) => dispatch(PlanActions.setIsDataSelection(status)),
    updateDataSourceEditableStatus: (isDataSourceEditable,dataSourceKey,loggedInUser, authPermissions, dataItems) => dispatch(
      PlanActions.updateDataSourceEditableStatus(isDataSourceEditable,dataSourceKey,loggedInUser, authPermissions, dataItems)
    ),
    selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
    selectedDisplayMode: (value) => dispatch(ToolBarActions.selectedDisplayMode(value)),
    activeViewModePanel: (value) => dispatch(ToolBarActions.activeViewModePanel(value))
  })

   const PlanDataSelectionComponent = wrapComponentWithProvider(reduxStore, PlanDataSelection, mapStateToProps, mapDispatchToProps)
   export default PlanDataSelectionComponent
