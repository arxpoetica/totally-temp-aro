import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import Select from 'react-select'
import { PRICE_BOOK_TAB_NAMES_BY_ID } from './resource-config'

export class PriceBookEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      priceBookForState: '*',
      selectedpriceBookDefinition: 'equipmentItemList',
      isKeyExpanded: null,
      selectedFilter: [],
      structuredPriceBookDefinitions: '',
      constructionRatios: '',
      setOfSelectedEquipmentTags: '',
      selectedEquipmentTags: ''
    }

    this.props.getPriceBookStrategy()
    this.props.getEquipmentTags()
    this.filteredItems = '';
  }

  componentDidMount () {
    this.props.rebuildPricebookDefinitions(this.props.resourceManagerId)
    this.props.setModalTitle(this.props.resourceManagerName)
  }

  // To set Props values to State if props get modified
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(nextProps, state) {
    if(nextProps.priceBookDefinition !== undefined) {
      return {
        structuredPriceBookDefinitions: nextProps.priceBookDefinition.structuredPriceBookDefinitions,
        constructionRatios: nextProps.constructionRatios,
        setOfSelectedEquipmentTags: nextProps.priceBookDefinition.setOfSelectedEquipmentTags,
        selectedEquipmentTags: nextProps.priceBookDefinition.selectedEquipmentTags
      }
    } else { return null }
  }
  
  render () {
    return this.props.priceBookStrategy === null || this.props.currentPriceBook === undefined || this.props.statesStrategy === undefined || this.props.priceBookDefinition === undefined || this.props.constructionRatios === undefined || this.state.structuredPriceBookDefinitions === ''
      ? null
      : <div>{this.renderPriceBookEditor()}</div>
  }

  renderPriceBookEditor()  {

    let filterTagList = this.props.equipmentTags.map(function(newkey, index) { 
      return {"id":newkey.id, "name":newkey.name, "description":newkey.description, "colourHue":newkey.colourHue, "value": newkey.description, "label": newkey.description}; 
    });

    return (
      <div>
        <form className="form-horizontal">
          <div className="form-group">
            <div className="row">
              {/* A combobox for the state */}
              <label className="col-sm-3 control-label pb-label-height">
                {
                  this.props.priceBookStrategy.map((priceBookValue, pricebookIndex) => { 
                    let allStrategies = {}
                    allStrategies[priceBookValue.name] = priceBookValue
                    if(allStrategies[this.props.currentPriceBook.priceStrategy] !== undefined) {
                      return allStrategies[this.props.currentPriceBook.priceStrategy].description
                    }
                  })
                }
                code:
              </label>
              <div className="col-sm-3">
              {this.props.statesStrategy !== undefined &&
                <select className='form-control form-control-sm' onChange={event => { this.handlePriceBookForState(event) }} value={this.state.priceBookForState}>
                  {this.props.statesStrategy.statesForStrategy.map((source) => (
                    <option key={`data-source-dropdown-option-${source}`} value={source}>{source}</option>
                  ))}
                </select>
              }
            </div>
            </div>
          </div>
        </form>

        {/* Create tabs for each priceBookDefinition */}
        <ul className="nav nav-tabs" role="tablist">
          {this.props.priceBookDefinition.structuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => {
              if (priceBookValue.items.length) {
                return <li
                  key={pricebookIndex}
                  role="presentation"
                  onClick={(e)=>this.handlepriceBookDefinition(priceBookValue.id)}
                  className="nav-item"
                >
                  <a href={`#${priceBookValue.id}`} className={`nav-link ${this.props.priceBookDefinition.selectedDefinitionId === priceBookValue.id ? 'active' : ''}`} role="tab" data-toggle="tab">
                    {PRICE_BOOK_TAB_NAMES_BY_ID[priceBookValue.id]}
                  </a>
                </li>
              }
            })
          }
        </ul>

        {/* Create tab contents for each priceBookDefinition */}
        <div className="tab-content" style={{maxHeight: '500px', overflowY: 'auto'}}>
          {this.state.structuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => { 
            return (
              <div key={pricebookIndex} role="tabpanel" id={priceBookValue.id} className={`tab-pane ${this.state.selectedpriceBookDefinition === priceBookValue.id ? 'active' : ''}`} id="">
                {/* Filter equipment items. Only for equipmentItemList */}
                {this.state.selectedpriceBookDefinition === 'equipmentItemList' &&
                  <div className="row pt-3 pb-2 pl-2">
                    <label className="col-sm-2 control-label pb-label-height" style={{lineHeight: '32px'}}>Filters:</label>
                    <div className="col-sm-4">
                      <Select
                        isMulti
                        closeMenuOnSelect={true}
                        value={this.state.selectedFilter}
                        options={filterTagList}
                        hideSelectedOptions={true}
                        backspaceRemovesValue={false}
                        isSearchable={false}
                        placeholder="Filter Equipment"
                        onChange={(e)=>this.updateSetOfSelectedEquipmentTags(e, this.props.priceBookDefinition.selectedDefinitionId)}
                      />
                    </div>
                  </div>
                }

                {this.state.selectedpriceBookDefinition === 'fiberLaborList' &&
                  <div className="p-4">
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Cost</th>
                          <th>Units</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Common row for installed fiber total */}
                        <tr>
                          <td>Installed fiber (total)</td>
                          <td>{this.getTotalFiberInstallCost(this.props.constructionRatios, this.state.structuredPriceBookDefinitions, this.state.priceBookForState)}</td>
                          <td></td>
                          <td>
                            {this.shouldShowPercentageError(this.props.constructionRatios, this.state.structuredPriceBookDefinitions, this.state.priceBookForState) &&
                              <div className="alert alert-danger mb-0 p-1"><strong>Error:</strong> Total should be 100%</div>
                            }
                          </td>
                        </tr>
                        {/* Display all rows EXCEPT installed fiber, that is calculated above */}
                         {priceBookValue.items.map((definitionItem, definitionKey) => { 
                            if(definitionItem.name !== 'install_estimated'){
                              var constructionRatios = definitionItem.cableConstructionType !== undefined ? this.state.constructionRatios[this.state.priceBookForState].constructionRatios.cableConstructionRatios[definitionItem.cableConstructionType].ratio : ''
                              var percentageCost = (+constructionRatios) * 100.0

                              return (
                                <tr key={definitionKey}>
                                  <td>{definitionItem.description}</td>
                                  <td>
                                    <input type="text" onChange={(e)=>this.handleFiberLabourChange(e, definitionKey, definitionItem.id)} value={definitionItem.costAssignment !== undefined ? definitionItem.costAssignment.cost : 0} className="form-control form-control-sm"/>
                                  </td>
                                  <td>{definitionItem.unitOfMeasure}</td>
                                  <td>
                                    <input type="number" className="form-control form-control-sm" onChange={(e)=>this.handleFiberPercentageChange(e, definitionItem)} value={+percentageCost.toFixed(2)}/>
                                  </td>
                                </tr>
                              )
                            }
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                }

                {/* Common markup for everything except fiberLaborList
                The top-level table for this priceBookDefinition */}
                {this.state.selectedpriceBookDefinition !== 'fiberLaborList' &&
                  <table className="table table-striped">
                    <tbody>
                      {/* Loop through each item in the priceBookDefinition */}
                      {this.filteredItems = priceBookValue.items.filter((item) => this.equipmentTagFilter(item, this.state.setOfSelectedEquipmentTags, this.props.priceBookDefinition.selectedDefinitionId))
                        .map((definitionItem, definitionKey) => 
                          <tr key={definitionKey}>
                            {/* Description of this item */}
                            <td className="p-2 pl-3">
                              <div style={{fontWeight: '700', cursor: 'pointer'}} onClick={event => { this.toggleIsKeyExpanded(definitionItem.id) }}>
                                {
                                  this.state.isKeyExpanded === definitionItem.id
                                  ? <i className="far fa-minus-square"></i>
                                  : <i className="far fa-plus-square"></i>
                                }
                                <span className="pl-2">{definitionItem.description}</span>
                              </div>

                              {this.state.isKeyExpanded === definitionItem.id &&
                                <div>
                                {/* IF a cost assignment is defined for this item, provide the ability to edit it */}
                                  {definitionItem.costAssignment &&
                                    <div className="row" style={{width: '100%', margin: '0px'}}>
                                      <table className="table table-bordered" style={{marginBottom: '0px'}}>
                                        <tbody>
                                          <tr>
                                            <td style={{verticalAlign: 'middle'}}>Cost:</td>
                                            <td style={{width: '100px', borderRight: 'none'}}>
                                              <input type="text" onChange={(e)=>this.handleCostChange(e, definitionKey, definitionItem.id)} value={definitionItem.costAssignment !== undefined ? definitionItem.costAssignment.cost : 0} className="form-control form-control-sm"/>
                                            </td>
                                            <td style={{ verticalAlign: 'middle', borderLeft: 'none' }}>{definitionItem.unitOfMeasure}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                  </div>
                                  }        

                                  {/* Display details for sub-items if we have at least one sub-item */}
                                  {definitionItem.subItems && definitionItem.subItems.length > 0 &&
                                    <div>
                                      SubItems:
                                    </div>
                                  }

                                  <div style={{paddingLeft: '20px', width: '100%'}}>
                                    <table className="table table-bordered" style={{marginBottom: '0px'}}>
                                      <tbody>
                                        {/* Loop through all sub-items in this item */}
                                        {definitionItem.subItems.map((subItem, subKey) => { 
                                          return (
                                            <tr key={subKey}>
                                              {/* START TD block for sub-items with detailType === 'value' */}
                                              {subItem.detailType === 'value' &&
                                                <td style={{verticalAlign: 'middle'}}>{subItem.item.description}</td>
                                              }
                                              {subItem.detailType === 'value' &&
                                                <td style={{width: '100px', borderRight: 'none'}}>
                                                  <input type="text" onChange={(e)=>this.handleCostAssignmentChange(e, definitionKey, subItem.id)} value={subItem.costAssignment !== undefined ? subItem.costAssignment.cost : 0} className="form-control form-control-sm"/>
                                                </td>
                                              }
                                              {subItem.detailType === 'value' &&
                                                <td style={{verticalAlign: 'middle', borderLeft: 'none'}}>
                                                  {subItem.item.unitOfMeasure}
                                                </td>
                                              }
                                              {/* END TD block for sub-items with detailType === 'value' */}
                                            </tr>
                                          )
                                        })
                                      }
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              }
                            </td>
                          </tr>
                        )
                      }
                      {/* Show a warning if we have selected any filters AND all rows are filtered out. */}

                      {(this.state.selectedEquipmentTags.length > 0) && (this.filteredItems.length === 0) &&
                        <tr>
                          <td colSpan="4">
                            <div className="alert alert-warning m-0">
                              No items to show with the current filters.
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>            
            )
          })
        }
        </div>
        <div style={{flex: '0 0 auto'}}>
          <div style={{textAlign: 'right', paddingTop: '15px'}}>
            <button className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
              <i className="fa fa-undo action-button-icon"></i>Discard changes
            </button>
            <button className="btn btn-primary" onClick={() => this.saveConfigurationToServer()}>
              <i className="fa fa-save action-button-icon"></i>Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  handleFiberPercentageChange(e, definitionItem){
    let pristineConstructionRatios = this.state.constructionRatios
    pristineConstructionRatios[this.state.priceBookForState].constructionRatios.cableConstructionRatios[definitionItem.cableConstructionType].ratio = (+e.target.value) / 100.0

    this.setState({ constructionRatios: pristineConstructionRatios })
  }


  handleCostChange(e, parentDefinitionKey, parentCostId){

    let pristineStructuredPriceBookDefinitions = this.state.structuredPriceBookDefinitions
    pristineStructuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => {
      priceBookValue.items.map((definitionItem, definitionKey) => {
        if(parentDefinitionKey === definitionKey){
          if(definitionItem.costAssignment){
            if(parentCostId === definitionItem.id){
              definitionItem.costAssignment.cost = e.target.value
          }
          }
        }
      })
    });
    this.setState({ structuredPriceBookDefinitions: pristineStructuredPriceBookDefinitions })
  }

  handleCostAssignmentChange(e, parentDefinitionKey, parentCostId){

    let pristineStructuredPriceBookDefinitions = this.state.structuredPriceBookDefinitions
    pristineStructuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => {
      priceBookValue.items.map((definitionItem, definitionKey) => {
        if(parentDefinitionKey === definitionKey){
          definitionItem.subItems.map((subItem, subKey) => { 
            if(subItem.detailType === 'value'){
              if(parentCostId === subItem.id)
                subItem.costAssignment.cost = e.target.value
            }
          })
        }
      })
    });
    this.setState({ structuredPriceBookDefinitions: pristineStructuredPriceBookDefinitions })
  }

  handleFiberLabourChange(e, parentDefinitionKey, parentCostId){

    let pristineStructuredPriceBookDefinitions = this.state.structuredPriceBookDefinitions
    pristineStructuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => {
      priceBookValue.items.map((definitionItem, definitionKey) => {
        if(parentDefinitionKey === definitionKey){
          if(parentCostId === definitionItem.id){
            definitionItem.costAssignment.cost = e.target.value
          }
        }
      })
    });
    this.setState({ structuredPriceBookDefinitions: pristineStructuredPriceBookDefinitions })
  }

  exitEditingMode(){
    this.props.onDiscard();
  }

  saveConfigurationToServer(){
    this.props.saveAssignmentsToServer(this.props.statesStrategy.pristineAssignments, this.state.structuredPriceBookDefinitions, this.props.constructionRatios, this.props.resourceManagerId)
  }

  toggleIsKeyExpanded (objIndex) {
    if (this.state.isKeyExpanded === objIndex) {
      objIndex = null
    }
    this.setState({ isKeyExpanded: objIndex })
  }

  getTotalFiberInstallCost (constructionRatios, structuredPriceBookDefinitions, selectedStateForStrategy) {
    const fiberLaborList = structuredPriceBookDefinitions.filter(item => item.id === 'fiberLaborList')[0]
    var totalInstallCost = 0
    fiberLaborList.items.forEach(item => {
      const ratioItem = constructionRatios[selectedStateForStrategy].constructionRatios.cableConstructionRatios[item.cableConstructionType]
      const ratio = ratioItem ? (ratioItem.ratio || 0.0) : 0.0
      const cost = item.costAssignment !== undefined ? item.costAssignment.cost : 0.0 || 0.0
      totalInstallCost += (cost * ratio)
    })
    return totalInstallCost
  }

  shouldShowPercentageError (constructionRatios, structuredPriceBookDefinitions, selectedStateForStrategy) {
    const fiberLaborList = structuredPriceBookDefinitions.filter(item => item.id === 'fiberLaborList')[0]
    var totalInstallPercentage = 0
    fiberLaborList.items.forEach(item => {
      const ratioItem = constructionRatios[selectedStateForStrategy].constructionRatios.cableConstructionRatios[item.cableConstructionType]
      const ratio = ratioItem ? (ratioItem.ratio || 0.0) : 0.0
      totalInstallPercentage += ratio
    })
    return Math.abs(1.0 - totalInstallPercentage) > 0.001 // Total percentage should be 100%
  }

  updateSetOfSelectedEquipmentTags(selectedFilter, definitionId){

    var selectedEquipmentTags = this.state.selectedEquipmentTags
    if(selectedFilter !== null){
      selectedEquipmentTags[definitionId] = selectedFilter
    } else {
      selectedEquipmentTags[definitionId] = []
    }

    var setOfSelectedEquipmentTags = this.state.setOfSelectedEquipmentTags
    setOfSelectedEquipmentTags[definitionId] = new Set(selectedEquipmentTags[definitionId].map(equipmentTag => equipmentTag.id))
    this.setState({setOfSelectedEquipmentTags: setOfSelectedEquipmentTags, selectedFilter: selectedFilter})
  }

  equipmentTagFilter (item, setOfSelectedEquipmentTags, selectedDefinitionId) {
    if (setOfSelectedEquipmentTags[selectedDefinitionId].size === 0) {
      return true // No filters applied
    } else {
      const tags = item.tagMapping || [] // tagMapping can be null
      const itemHasTag = tags.filter(tagId => setOfSelectedEquipmentTags[selectedDefinitionId].has(tagId)).length > 0
      return itemHasTag
    }
  }

  handlepriceBookDefinition(priceBookDefinitionId){
    this.setState({selectedpriceBookDefinition: priceBookDefinitionId})
  }

  handlePriceBookForState(e){
    this.setState({ priceBookForState: e.target.value }); 
    const {priceBookDefinitions, pristineAssignments} = this.props.statesStrategy
    this.props.definePriceBookForSelectedState(e.target.value, priceBookDefinitions, pristineAssignments)
  }
}

const mapStateToProps = (state) => ({
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  priceBookStrategy: state.resourceEditor.priceBookStrategy,
  equipmentTags: state.resourceEditor.equipmentTags,
  currentPriceBook: state.resourceEditor.currentPriceBook,
  statesStrategy: state.resourceEditor.statesStrategy,
  priceBookDefinition: state.resourceEditor.priceBookDefinition,
  constructionRatios: state.resourceEditor.constructionRatios
})   

const mapDispatchToProps = (dispatch) => ({
  getPriceBookStrategy: () => dispatch(ResourceActions.getPriceBookStrategy()),
  getEquipmentTags: () => dispatch(ResourceActions.getEquipmentTags()),
  rebuildPricebookDefinitions: (priceBookId) => dispatch(ResourceActions.rebuildPricebookDefinitions(priceBookId)),
  definePriceBookForSelectedState: (selectedStateForStrategy, priceBookDefinitions, pristineAssignments) => dispatch(ResourceActions.definePriceBookForSelectedState(selectedStateForStrategy, priceBookDefinitions, pristineAssignments)),
  saveAssignmentsToServer: (pristineAssignments, structuredPriceBookDefinitions, constructionRatios, priceBookId) => dispatch(ResourceActions.saveAssignmentsToServer(pristineAssignments, structuredPriceBookDefinitions, constructionRatios, priceBookId)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
})

const PriceBookEditorComponent = connect(mapStateToProps, mapDispatchToProps)(PriceBookEditor)
export default PriceBookEditorComponent