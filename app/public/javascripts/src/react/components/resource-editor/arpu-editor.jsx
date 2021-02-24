import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import { Dropdown } from './arpu-editor-dropdown.jsx'
import './arpu-editor.css'

export class ArpuEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      modelIndex : 0,
      arpuModels: [],
    }
  }

  componentDidMount () {
    this.props.loadArpuManagerConfiguration(this.props.resourceManagerId)
    this.props.setModalTitle(this.props.resourceManagerName)
  }

  componentWillReceiveProps(nextProps){
    if(this.props != nextProps) {
      if(nextProps.arpuModels !== undefined) {
        this.setState({ arpuModels: nextProps.arpuModels })
      }
    }
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
              <option key={model.id} value={index}>
                {model.arpuModelKey.locationEntityType} / {model.arpuModelKey.speedCategory}
              </option>
            )}
          </select>
        </div>

        <div className="segmentation">
          {arpuModels[modelIndex] ? this.renderSegmentation() : null}
        </div>

        <div style={{flex: '0 0 auto'}}>
          <div style={{textAlign: 'right'}}>
            <button className="btn btn-light mr-2" onClick={this.exitEditingMode}>
              <i className="fa fa-undo action-button-icon"></i>Discard changes
            </button>
            <button className="btn btn-primary" onClick={this.saveConfigurationToServer}>
              <i className="fa fa-save action-button-icon"></i>Save
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
              <h3>{product.name}</h3>
              <Dropdown
                product={product}
                handler={event => this.handleProductChange(event, index)}
              />
            </div>
          )}
        </div>

        {/* {#each [...segments, ''] as segment, index} */}
        {[...segments, ''].map((segment, segmentIndex) =>
          <div key={segmentIndex} className="arpu-row">
            <div className="arpu-cell select">
              {segment.name || ''}
              {/* <Select
                value={segment.segmentId}
                options={segments}
                handler={(value, prev_value) => handler(value, prev_value, segmentIndex)}
              /> */}
            </div>
            {segment ? segment.percents.map((percent, cellIndex) =>
              <div key={cellIndex} className="arpu-cell input">
                {/* <input type="number" min="0" max={get_max(segment.percents)} bind:value={percent}> */}
                {/* <input onChange={event => this.handleCellChange(event, modelIndex)} /> */}
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
    const { value } = target
    const { arpuModels, modelIndex } = this.state
    arpuModels[modelIndex].segments[segmentIndex].percents[cellIndex] = value
    this.setState({ arpuModels })
  }

  exitEditingMode() {
    this.props.setIsResourceEditor(true);
  }

  saveConfigurationToServer() {
    this.props.saveArpuConfigurationToServer(this.props.arpuManager.id, this.props.arpuModelsPristine, this.state.arpuModels)
  }
}

  const mapStateToProps = (state) => ({
    arpuManager: state.resourceEditor.arpuManager,
    arpuModels: state.resourceEditor.arpuModels,
    arpuModelsPristine : state.resourceEditor.arpuModelsPristine,
    resourceManagerName: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,  
    resourceManagerId: state.resourceManager.editingManager && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
  })   

  const mapDispatchToProps = (dispatch) => ({
    getResourceTypes: () => dispatch(ResourceActions.getResourceTypes()),
    loadArpuManagerConfiguration: (arpuManagerId) => dispatch(
      ResourceActions.loadArpuManagerConfiguration(arpuManagerId)
    ),
    setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
    saveArpuConfigurationToServer: (arpuManagerId, pristineArpuManager, arpuManager) => dispatch(
      ResourceActions.saveArpuConfigurationToServer(arpuManagerId, pristineArpuManager, arpuManager)
    ),
    setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
  })

const ArpuEditorComponent = connect(mapStateToProps, mapDispatchToProps)(ArpuEditor)
export default ArpuEditorComponent
