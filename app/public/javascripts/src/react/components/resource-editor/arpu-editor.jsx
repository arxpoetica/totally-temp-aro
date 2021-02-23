import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
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
            {arpuModels.map((item, index) =>
              <option key={index} value={index}>
                {item.arpuModelKey.locationEntityType} / {item.arpuModelKey.speedCategory}
              </option>
            )}
          </select>
        </div>

        <div className="segmentation">

          <div className="selectors">
            <div className="s-row"></div>
            {/* {this.state.segments.map((segment, index) => (
              <div className="s-row">
                <select>
                  <option value="">[Add Segment]</option>
                  <option value="Segment A">Segment A</option>
                  <option value="Segment B">Segment B</option>
                  <option value="Remove Segment">Remove Segment</option>
                </select>
              </div>
            ))} */}
          </div>

          <div className="products">

            <h2>{modelIndex}</h2>
            <div>
              {JSON.stringify(arpuModels[modelIndex])}
            </div>

            {/* {this.state.products.map((product, index) => (
              <div className="s-col product">
                <div className="s-row">
                  <h3>{product.name}</h3>
                  <div className="select-dropdown">
                    <button className="toggle">
                      20 | 20 | 20
                    </button>
                    <div className="dropdown">
                      <ul>
                        <li>
                          <h4>ARPU</h4>
                          <p>Avg. Revenue Per User</p>
                          <input type="number"/>
                        </li>
                        <li>
                          <h4>OPEX</h4>
                          <p>Operating Expense</p>
                          <input type="number"/>
                        </li>
                        <li>
                          <h4>Cost</h4>
                          <p>Acquisition <br/>Cost</p>
                          <input type="number"/>
                        </li>
                      </ul>
                      <button
                        type="button"
                        className="close"
                        aria-label="Close"
                      >
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                  </div>
                </div>

                {product.segments.map((segment, index) => (
                  <div className="s-row">
                    <input type="number" min="0" max="100" value="100" />
                  </div>
                ))}

              </div>
            ))} */}
          </div>

        </div>



        {/* <h2>ARPU Strategy</h2>
        <input
          type="text"
          className="form-control"
          name="arpuStrategy"
          onChange={event => this.handleArpuChange(event, modelIndex)}
          value={arpuModels[modelIndex].arpuStrategy}
        /> */}
        {/* <h2>Revenue</h2>
        <input
          type="text"
          className="form-control"
          name="revenue"
          onChange={event => this.handleArpuChange(event, modelIndex)}
          value={arpuModels[modelIndex].revenue}
        /> */}

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

  handleArpuChange (e, modelIndex) {  
    let name = e.target.name;
    let value = e.target.value;

    const { arpuModels } = this.state
    arpuModels[modelIndex][name] = value

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
