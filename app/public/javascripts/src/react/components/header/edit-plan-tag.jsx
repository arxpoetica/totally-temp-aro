import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import Select from "react-select";

export class EditPlanTagMode extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }

    this.props.refreshTagList
  }

  render() {
    const {searchList, selectedList, objectName} = this.props

    // console.log(searchList)
    // console.log(selectedList)
    let optionsList = []; let defaultList=[];
    if(objectName === 'Tag'){
      optionsList = searchList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.name, "label": newkey.name}; 
      });
    } else if (objectName === 'Service Area'){
      optionsList = searchList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.code, "label": newkey.code}; 
      });
    }
    

    return(
      <Select
        isMulti
        options={optionsList}
        defaultValue={selectedList}
        closeMenuOnSelect={false}
        hideSelectedOptions={true}
        backspaceRemovesValue={true}
        isSearchable={true} 
        isClearable={false}
        placeholder={`Select ${objectName}...`}
        onChange={(e,id)=>this.onSelectedItemsChanged(e)}
      />
    )
  }

  onSelectedItemsChanged (e) {
    console.log(e)
  }
  
}

const mapStateToProps = (state) => ({
})  

const mapDispatchToProps = (dispatch) => ({
})

const EditPlanTagModeComponent = wrapComponentWithProvider(reduxStore, EditPlanTagMode, mapStateToProps, mapDispatchToProps)
export default EditPlanTagModeComponent