import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import Select from "react-select";


export class PriceBookEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      priceBookForState: '',
      selectedpriceBookDefinition: 'equipmentItemList'
    }

    this.props.getPriceBookStrategy()
  }

  componentDidMount () {
    this.props.rebuildPricebookDefinitions(this.props.selectedResourceManagerId)
  }

  render () {
    return this.props.priceBookStrategy === null || this.props.currentPriceBook === undefined || this.props.statesStrategy === undefined || this.props.priceBookDefinition === undefined || this.props.constructionRatios === undefined
      ? null
      : <div>{this.renderPriceBookEditor()}</div>
  }  

  renderPriceBookEditor()  {
    return (
      <div>
        <h4>{this.props.resourceManagerName}</h4>

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
        {
          this.props.priceBookDefinition.structuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => { 
            return (
              <li key={pricebookIndex} role="presentation" onClick={(e)=>this.handlepriceBookDefinition(priceBookValue.id)} className={`nav-item ${this.props.priceBookDefinition.selectedDefinitionId === priceBookValue.id ? 'active' : ''}`}>
                <a href={`#${priceBookValue.id}`} className="nav-link" role="tab" data-toggle="tab">
                  {priceBookValue.description}
                </a>
              </li>
            )
          })
        }
        </ul>

        {/* Create tab contents for each priceBookDefinition */}
        <div className="tab-content" style={{maxHeight: '500px', overflowY: 'auto'}}>

        { 
          this.props.priceBookDefinition.structuredPriceBookDefinitions.map((priceBookValue, pricebookIndex) => { 
            const priceBookFilter = [{"id":'01', "value": 'Direct Routing', "label": 'Direct Routing'},{"id":'02', "value": 'DSL', "label": 'DSL'},
                                    {"id":'03', "value": 'ODN', "label": 'ODN'},{"id":'04', "value": '5G', "label": '5G'}]; 
            return (
              <div key={pricebookIndex} role="tabpanel" id={priceBookValue.id} className={`tab-pane ${this.props.priceBookDefinition.selectedDefinitionId === priceBookValue.id ? 'active' : ''}`} id="">
                {/* Filter equipment items. Only for equipmentItemList */}
                {this.state.selectedpriceBookDefinition === 'equipmentItemList' &&
                  <div className="row pt-3 pb-2 pl-2">
                    <label className="col-sm-2 control-label pb-label-height" style={{lineHeight: '32px'}}>Filters:</label>
                    <div className="col-sm-4">
                      <Select
                        isMulti
                        closeMenuOnSelect={true}
                        value=''
                        options={priceBookFilter}
                        hideSelectedOptions={true}
                        backspaceRemovesValue={false}
                        isSearchable={true}
                        isClearable=''
                        isDisabled=''
                        placeholder="Filter Equipment"
                        onChange={(e)=>this.handleRegionsChange(e)}
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
                          <td>{this.getTotalFiberInstallCost(this.props.constructionRatios, this.props.priceBookDefinition.structuredPriceBookDefinitions, this.props.priceBookDefinition.selectedStateForStrategy)}</td>
                          <td></td>
                          <td>
                            <div className="alert alert-danger mb-0 p-1"><strong>Error:</strong> Total should be 100%</div>
                          </td>
                        </tr>
                        {/* Display all rows EXCEPT installed fiber, that is calculated above */}
                        <tr>
                          <td></td>
                          <td>
                            <input type="text" className="form-control form-control-sm"/>
                          </td>
                          <td></td>
                          <td>
                            <input className="form-control form-control-sm"/>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }




              </div>            
            )
          })
        }


        </div>

      </div>
    )
  }

  getTotalFiberInstallCost (constructionRatios, structuredPriceBookDefinitions, selectedStateForStrategy) {
    const fiberLaborList = structuredPriceBookDefinitions.filter(item => item.id === 'fiberLaborList')[0]
    var totalInstallCost = 0
    fiberLaborList.items.forEach(item => {
      const ratioItem = constructionRatios[selectedStateForStrategy].constructionRatios.cableConstructionRatios[item.cableConstructionType]
      const ratio = ratioItem ? (ratioItem.ratio || 0.0) : 0.0
      const cost = item.costAssignment.cost || 0.0
      totalInstallCost += (cost * ratio)
    })
    return totalInstallCost
  }

  handlepriceBookDefinition(priceBookDefinitionId){
    this.setState({selectedpriceBookDefinition: priceBookDefinitionId})
  }

  handlePriceBookForState(e){
    this.setState({ priceBookForState: e.target.value }); 
    const {selectedStateForStrategy, priceBookDefinitions, pristineAssignments} = this.props.statesStrategy
    this.props.definePriceBookForSelectedState(selectedStateForStrategy, priceBookDefinitions, pristineAssignments)
  }
}

const mapStateToProps = (state) => ({
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  priceBookStrategy: state.resourceEditor.priceBookStrategy,
  currentPriceBook: state.resourceEditor.currentPriceBook,
  statesStrategy: state.resourceEditor.statesStrategy,
  priceBookDefinition: state.resourceEditor.priceBookDefinition,
  constructionRatios: state.resourceEditor.constructionRatios,
})   

const mapDispatchToProps = (dispatch) => ({
  getPriceBookStrategy: () => dispatch(ResourceActions.getPriceBookStrategy()),
  rebuildPricebookDefinitions: (priceBookId) => dispatch(ResourceActions.rebuildPricebookDefinitions(priceBookId)),
  definePriceBookForSelectedState: (selectedStateForStrategy, priceBookDefinitions, pristineAssignments) => dispatch(ResourceActions.rebuildPricebookDefinitions(selectedStateForStrategy, priceBookDefinitions, pristineAssignments)),

})

const PriceBookEditorComponent = connect(mapStateToProps, mapDispatchToProps)(PriceBookEditor)
export default PriceBookEditorComponent