import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import Select, { components } from "react-select";
import createClass from "create-react-class";
import ToolBarActions from './tool-bar-actions'

const square = (color) => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    content: '" "',
    display: 'block',
    margin: 5,
    height: 10,
    width: 10,
  },
});

export class EditPlanTagMode extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }

    this.handleInputChange = _.debounce(this.handleInputChange.bind(this),250)
  }

  render() {
    const {searchList, selectedList, objectName} = this.props
    
    const customStyles = {
      control: styles => ({ ...styles, backgroundColor: 'white' }),
      option: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
      multiValue: (styles, state) => ({
        ...styles,
        ...square(this.props.getTagColour(state.data)),
      }),
    }

    let optionsList = []; let defaultList=[];
    if(objectName === 'Tag'){
      optionsList = searchList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.name, "label": newkey.name, "colourHue": newkey.colourHue}; 
      });
      defaultList = selectedList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.name, "label": newkey.name,  "colourHue": newkey.colourHue}; 
      });
    } else if (objectName === 'Service Area'){
      optionsList = searchList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.code, "label": newkey.code, "name": newkey.name}; 
      });
      defaultList = selectedList.map(function(newkey, index) {
        return {"id":newkey.id, "value": newkey.code, "label": newkey.code, "name": newkey.name}; 
      });
    }
    
    return (
      <Select
        isMulti
        options={optionsList}
        defaultValue={defaultList}
        closeMenuOnSelect={false}
        hideSelectedOptions={true}
        backspaceRemovesValue={true}
        isSearchable={true} 
        isClearable={false}
        components={this.props.objectName === 'Service Area' ? { Option } : ''}
        placeholder={`Select ${objectName}...`}
        onChange={(e,id)=>this.onSelectedItemsChanged(e)}
        onInputChange={(e, action) => this.handleInputChange(e, action)}
        styles={customStyles}
      />
    )
  }

  handleInputChange (searchText, { action }) {
    switch (action) {
      case 'input-change':
        this.props.objectName === 'Service Area'
        ? this.props.refreshTagList(this.props.dataItems, searchText, false)
        : ''
        return
      default:
        return
    }
  }

  onSelectedItemsChanged (event) {
    var selectedItems = [];
    if(event !== null) {
      var objectName = this.props.objectName;
      var searchlist = this.props.searchList;

      if(objectName === 'Tag') {
        searchlist.filter(function (o1) {
          return event.some(function (o2) {
            if(o1.id === o2.id) return selectedItems.push(o1);
          });
        });
        this.props.setCurrentPlanTags(selectedItems)
      } else if(objectName === 'Service Area') {
        searchlist.filter(function (o1) {
          return event.some(function (o2) {
            if(o1.id === o2.id) return selectedItems.push(o1);
          });
        });
        this.props.setCurrentPlanServiceAreaTags(selectedItems)
      } 
    }
  }
}

const Option = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <label>{this.props.value}</label>&nbsp;
          <small>{this.props.data.name}</small>
        </components.Option>
      </div>
    );
  }
});

const mapStateToProps = (state) => ({
  dataItems: state.plan.dataItems,
})  

const mapDispatchToProps = (dispatch) => ({
  setCurrentPlanTags: (currentPlanTags) => dispatch(ToolBarActions.setCurrentPlanTags(currentPlanTags)),
  setCurrentPlanServiceAreaTags: (currentPlanServiceAreaTags) => dispatch(ToolBarActions.setCurrentPlanServiceAreaTags(currentPlanServiceAreaTags)),
  getTagColour: (tag) => dispatch(ToolBarActions.getTagColour(tag))
})

const EditPlanTagModeComponent = wrapComponentWithProvider(reduxStore, EditPlanTagMode, mapStateToProps, mapDispatchToProps)
export default EditPlanTagModeComponent