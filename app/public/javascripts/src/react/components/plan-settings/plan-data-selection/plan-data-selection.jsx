import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import GlobalSettings from '../../global-settings/global-settings.jsx'
import PlanActions from '../../plan/plan-actions'
import Select, { components } from "react-select";
import createClass from "create-react-class";

export class PlanDataSelection extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  render () {
    return this.props.dataItems === undefined
      ? null
      : this.renderPlanDataSelection()
  }

  renderPlanDataSelection() {

    return (
      <div style={{position: 'relative', height: '100%'}}>
        <table className="table table-sm table-striped">
          <tbody>
            {Object.entries(this.props.dataItems).map(([ objKey, objValue ], objIndex) => {

              let optionsList = []; let defaultList=[];
              if(objValue.allLibraryItems.length > 0){
                optionsList = objValue.allLibraryItems.map(function(newkey, index) {
                  return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
                });
              }

              if(objValue.selectedLibraryItems.length > 0){
                defaultList = objValue.selectedLibraryItems.map(function(newkey, index) { 
                  return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
                });
              }

              console.log(optionsList)
              console.log(defaultList)

              return (
                <tr key={objIndex}>
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
                        isSearchable={false} 
                        isClearable=''
                        isDisabled=''
                        placeholder="None Selected"
                        onChange={(e,id)=>this.handleListGroupChange(e,user.id)}
                      />
                      <div className="btn-group btn-group-sm" style={{flex: '0 0 auto'}}>
                        <button className="btn btn-light">
                          <span className="fa fa-edit"></span>
                        </button>
                        <button className="btn btn-light">
                          <span className="fa fa-upload"></span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            )}

          </tbody>
          
        </table>
      </div>

    )
  }

}

const Option = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <input
            type="checkbox"
            // checked={}
            onChange={e => null}
          />{" "}
          <label>{this.props.value} </label>
        </components.Option>
      </div>
    );
  }
});

  const mapStateToProps = (state) => ({
    dataItems: state.plan.dataItems
  })   

  const mapDispatchToProps = (dispatch) => ({
  })

   const PlanDataSelectionComponent = wrapComponentWithProvider(reduxStore, PlanDataSelection, mapStateToProps, mapDispatchToProps)
   export default PlanDataSelectionComponent
