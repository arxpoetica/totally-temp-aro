import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import { Dropdown } from './arpu-editor-dropdown.jsx'
import './arpu-editor.css'

export class ArpuEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      modelIndex: 0,
      arpuModels: [],
    }
  }

  componentDidMount () {
    this.props.loadArpuManagerConfiguration(this.props.resourceManagerId)
    this.props.setModalTitle(this.props.resourceManagerName)
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.arpuModels && nextProps.arpuModels !== prevState.arpuModels) {
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
    const { arpuModels, modelIndex } = this.state

    return (
      <div className="arpu-manager">

        <div className="header">
          <h2>ARPU Manager:</h2>
          {/* list of ARPU models that the user can edit */}
          <select onChange={event => this.setState({ modelIndex: event.target.value })}>
            {/* <option value="">[Select a model]</option> */}
            {arpuModels.map((model, index) =>
              <option key={index} value={index}>
                {model.arpuModelKey.locationEntityType} / {model.arpuModelKey.speedCategory}
              </option>
            )}
          </select>
        </div>

        <div className="body">
          <div className="segmentation">
            {arpuModels[modelIndex] ? this.renderSegmentation() : null}
          </div>
          <div className="buttons">
            <button className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
              <i className="fa fa-undo action-button-icon"></i>&nbsp;Discard changes
            </button>
            <button className="btn btn-primary" onClick={() => this.saveConfigurationToServer()}>
              <i className="fa fa-save action-button-icon"></i>&nbsp;Save
            </button>
          </div>
        </div>

      </div>
    )
  }

  renderSegmentation() {

    const { arpuModels, modelIndex } = this.state
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
                handler={event => this.handleProductChange(event, index)}
              />
            </div>
          )}
        </div>

        {[...segments, ''].map((segment, segmentIndex) =>
          <div key={segmentIndex} className="arpu-row">
            <div className="arpu-cell select">
              {segment.description || segment.name}
            </div>
            {segment ? segment.percents.map((percent, cellIndex) =>
              <div key={cellIndex} className="arpu-cell input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percent}
                  onChange={event => this.handleCellChange(event, segmentIndex, cellIndex)}
                />
              </div>
            ) : null}
          </div>
        )}
      </>
    )
  }

  handleProductChange({ target }, productIndex) {
    const { name, value } = target
    const { arpuModels, modelIndex } = this.state
    arpuModels[modelIndex].products[productIndex][name] = value
    this.setState({ arpuModels })
  }

  handleCellChange({ target }, segmentIndex, cellIndex) {
    let value = parseFloat(target.value)
    const { arpuModels, modelIndex } = this.state

    const { percents } = arpuModels[modelIndex].segments[segmentIndex]
    const priorValue = percents[cellIndex]
    const sum = percents.reduce((sum, value) => sum + value, 0) - priorValue
    if (sum + value > 100) {
      value = 100 - sum
    }

    arpuModels[modelIndex].segments[segmentIndex].percents[cellIndex] = value
    this.setState({ arpuModels })
  }

  exitEditingMode() {
    this.props.setIsResourceEditor(true)
  }

  saveConfigurationToServer() {
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
