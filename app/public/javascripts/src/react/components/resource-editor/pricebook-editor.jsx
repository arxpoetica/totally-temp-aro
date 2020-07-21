import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'

export class PriceBookEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }

    this.props.getPriceBookStrategy()
  }

  componentDidMount () {
    this.props.rebuildPricebookDefinitions(this.props.selectedResourceManagerId)
  }

  render () {
    return this.props.priceBookStrategy === null
      ? null
      : <div>{this.renderPriceBookEditor()}</div>
  }  

  renderPriceBookEditor()  {

    console.log(this.props.priceBookStrategy)
    console.log(this.props.currentPriceBook)
    console.log(this.props.statesStrategy)
    console.log(this.props.priceBookDefinition)

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

                    if(allStrategies[this.props.currentPriceBook.priceStrategy] !== undefined){
                      return allStrategies[this.props.currentPriceBook.priceStrategy].description
                    }
                  })
                }
                code:
              </label>
              <div className="col-sm-3">
              {this.props.statesStrategy !== undefined &&
                <select className='form-control form-control-sm' onChange={event => { this.onSelectSource(event) }} value={this.props.statesStrategy.selectedStateForStrategy}>
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
              <li role="presentation" className={`nav-item ${this.props.priceBookDefinition.selectedDefinitionId === priceBookValue.id ? 'active' : ''}`}>
                <a href={`#${priceBookValue.id}`} className="nav-link" role="tab" data-toggle="tab">
                  {priceBookValue.description}
                </a>
              </li>
            )
          })
        }
        </ul>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  priceBookStrategy: state.resourceEditor.priceBookStrategy,
  currentPriceBook: state.resourceEditor.currentPriceBook,
  statesStrategy: state.resourceEditor.statesStrategy,
  priceBookDefinition: state.resourceEditor.priceBookDefinition,
})   

const mapDispatchToProps = (dispatch) => ({
  getPriceBookStrategy: () => dispatch(ResourceActions.getPriceBookStrategy()),
  rebuildPricebookDefinitions: (priceBookId) => dispatch(ResourceActions.rebuildPricebookDefinitions(priceBookId)),
})

const PriceBookEditorComponent = connect(mapStateToProps, mapDispatchToProps)(PriceBookEditor)
export default PriceBookEditorComponent