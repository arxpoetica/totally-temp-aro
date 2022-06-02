import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import { Accordion, AccordionRow } from '../common/accordion/Accordion.jsx'
import { Input } from './../common/forms/Input.jsx'
import { Select } from './../common/forms/Select.jsx'
import { Dropdown } from './arpu-editor-dropdown.jsx'
import './arpu-editor.css'

export class ArpuEditor extends Component {
  constructor (props) {
    super(props)

    this.state = { arpuModels: [] }
    this.OPTIONS = Object.freeze({
      global: 'Global',
      segmentation: 'Segmentation',
      tsm: 'Telecom Spend Matrix',
    })
  }

  componentDidMount () {
    this.props.loadArpuManagerConfiguration(this.props.resourceManagerId)
    this.props.setModalTitle(this.props.resourceManagerName)
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.arpuModels && nextProps.arpuModels !== prevState.arpuModels) {
      nextProps.arpuModels.forEach(arpuModelObject => arpuModelObject.hasInvalidValuesSelected = false)

      return { arpuModels: nextProps.arpuModels }
    }
    else return null
  }

  render () {
    return !this.props.arpuModels
      ? null
      : this.renderArpuEditor()
  }

  renderArpuEditor() {
    const { arpuModels } = this.state

    const selector = (model, index) =>
      <>
        <div className="strategy">
          Strategy:
          {model.options.length > 1 ?
            <Select
              value={model.strategy}
              options={model.options}
              onClick={event => event.stopPropagation()}
              onChange={event => this.handleStrategyChange(event, index)}
            />
            : ' Global'
          }
        </div>
        {model.hasInvalidValuesSelected
          && (
            <div className="label label-danger alert-danger">
              Segmentation Strategy cannot be saved while Default Segment is allocated 100% of Default Product.
            </div>
          )
        }
      </>

    return (
      <div className="arpu-manager">

        <Accordion items={arpuModels}>
          {arpuModels.map((model, modelIndex) =>
            // NOTE: passing JSX content to the `header` prop
            <AccordionRow
              key={modelIndex}
              index={modelIndex}
              title={model.title}
              header={selector(model, modelIndex)}
            >
              {model.strategy === 'override' &&
                <div className="arpu-content">
                  <p>Average Revenue Per User is set by individual locations.</p>
                </div>
              }
              {model.strategy === 'global' &&
                <div className="arpu-content">
                  <div className="arpu-global">
                    <h3>ARPU</h3>
                    <Input
                      type="number"
                      classes="currency"
                      min={0}
                      value={model.global}
                      onChange={event => this.handleGlobalChange(event, modelIndex)}
                    />
                  </div>
                </div>
              }
              {model.strategy === 'tsm' &&
                <div className="arpu-content">
                  <p>Average Revenue Per User is set by the Telecom Spend Matrix.</p>
                </div>
              }
              {model.strategy === 'segmentation' &&
                <div className="segmentation">
                  {this.renderSegmentation(modelIndex)}
                </div>
              }
            </AccordionRow>
          )}
        </Accordion>

        <div className="buttons">
          <button className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
            <i className="fa fa-undo action-button-icon"></i>&nbsp;Discard changes
          </button>
          <button className="btn btn-primary" onClick={() => this.saveConfigurationToServer()}>
            <i className="fa fa-save action-button-icon"></i>&nbsp;Save
          </button>
        </div>

      </div>
    )
  }

  renderSegmentation(modelIndex) {

    const { arpuModels } = this.state
    const model = arpuModels[modelIndex]
    const { segments, products } = model

    return (
      <>
        <div className="arpu-row products">
          {products.map((product, index) =>
            <div key={index} className="arpu-cell product">
              <h3>{product.description || product.name}</h3>
              <Dropdown
                product={product}
                handler={event => this.handleProductChange(event, modelIndex, index)}
              />
            </div>
          )}
        </div>

        {segments.map((segment, segmentIndex) =>
          <div key={segmentIndex} className="arpu-row">
            <div className="arpu-cell select">
              {segment.description || segment.name}
            </div>
            {segment.percents.map((percent, cellIndex) =>
              <div key={cellIndex} className="arpu-cell input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percent}
                  onChange={event => this.handleCellChange(event, modelIndex, segmentIndex, cellIndex)}
                />
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  handleGlobalChange({ target }, modelIndex) {
    let value = parseFloat(target.value) || 0
    value = value < 0 ? 0 : value
    const { arpuModels } = this.state
    arpuModels[modelIndex].global = value
    this.setState({ arpuModels })
  }

  handleStrategyChange(event, modelIndex) {
    const { arpuModels } = this.state
    const model = arpuModels[modelIndex]
    model.strategy = event.target.value

    model.hasInvalidValuesSelected = model.strategy === 'segmentation'
    && model.arpuModelKey.locationEntityType === 'household'
    && model.segments[0].percents[0] === 100

    this.setState({ arpuModels });
  }

  handleProductChange({ target }, modelIndex, productIndex) {
    const { name, value } = target
    const { arpuModels } = this.state
    arpuModels[modelIndex].products[productIndex][name] = value
    this.setState({ arpuModels })
  }

  handleCellChange({ target }, modelIndex, segmentIndex, cellIndex) {
    let value = parseFloat(target.value) || 0
    const { arpuModels } = this.state

    const { percents } = arpuModels[modelIndex].segments[segmentIndex]
    const priorValue = percents[cellIndex]
    const sum = percents.reduce((sum, value) => sum + value, 0) - priorValue
    if (sum + value > 100) {
      value = 100 - sum
    } else if (value < 0) {
      value = 0
    }

    arpuModels[modelIndex].hasInvalidValuesSelected = !(((segmentIndex || cellIndex) && value)
    || value !== 100)

    arpuModels[modelIndex].segments[segmentIndex].percents[cellIndex] = value
    this.setState({ arpuModels });
  }

  exitEditingMode() {
    this.props.onDiscard()
  }

  saveConfigurationToServer() {
    this.state.arpuModels.forEach(arpuModelObject => 
      delete arpuModelObject.hasInvalidValuesSelected)
      
    this.props.saveArpuModels(
      this.props.arpuManager.id,
      this.state.arpuModels,
    )
  }
}

const mapStateToProps = (state) => ({
  arpuManager: state.resourceEditor.arpuManager,
  arpuModels: state.resourceEditor.arpuModels,
  resourceManagerName:
    state.resourceManager.editingManager
    && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId:
    state.resourceManager.editingManager
    && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
})

const mapDispatchToProps = (dispatch) => ({
  getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
  loadArpuManagerConfiguration: (arpuManagerId) => dispatch(
    ResourceActions.loadArpuManagerConfiguration(arpuManagerId)
  ),
  setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
  saveArpuModels: (arpuManagerId, arpuManager) => dispatch(
    ResourceActions.saveArpuModels(arpuManagerId, arpuManager)
  ),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
})

const ArpuEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ArpuEditor)
export default ArpuEditorComponent
