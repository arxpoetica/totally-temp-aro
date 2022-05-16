import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from '../resource-actions'

const tabs = [
  {
    label: 'Models',
    key: 'inputs',
  },
  {
    label: 'Configuration',
    key: 'roicSettingsConfiguration',
  },
  {
    label: 'Subsidy',
    key: 'subsidyConfiguration',
  },
]
export class RoicEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: tabs[0].key,
      selectedRoicModelIndex: 0,
      speedCategoryHelp: '',
      roicManagerConfiguration: {},
    }

    this.speedCategoryHelpObj = {
      speedCategoryHelp: {
        default: 'The speed category describes the maximum rated speed (e.g. 100 Mbps) for a fiber/cable type',
        cat3:
        [
          'Category 3 cable, commonly known as Cat 3 or station wire, ',
          'and less commonly known as VG or voice-grade (as, for example, ',
          'in 100BaseVG), is an unshielded twisted pair (UTP) cable used in ',
          'telephone wiring. It is part of a family of copper cabling ',
          'standards defined jointly by the Electronic Industries Alliance ',
          '(EIA) and the Telecommunications Industry Association (TIA) ',
          'and published in TIA/EIA-568-B.',
        ].join(''),
        cat5:
        [
          'Category 5 cable, commonly referred to as Cat 5, is a twisted pair ',
          'cable for computer networks. The cable standard provides performance of ',
          'up to 100 Mbps and is suitable for most varieties of Ethernet over twisted pair. ',
          'Cat 5 is also used to carry other signals such as telephony and video. ',
        ].join(''),
        cat7:
        [
          'The Category 7 cable standard was ratified in 2002 to allow 10 Gigabit Ethernet ',
          'over 100 m of copper cabling. The cable contains four twisted copper wire pairs, ',
          'just like the earlier standards. Category 7 cable can be terminated either with ',
          '8P8C compatible GG45 electrical connectors which incorporate the 8P8C standard or ',
          'with TERA connectors. When combined with GG-45 or TERA connectors, Category 7 cable ',
          'is rated for transmission frequencies of up to 600 MHz. ',
        ].join('')
      },
    }

    this.cashFlowStrategyTypes = {
      COMPUTED_ROIC: { id: 'COMPUTED_ROIC', label: 'Computed ROIC' },
      ESTIMATED_ROIC: { id: 'ESTIMATED_ROIC', label: 'Estimated ROIC' },
      EXTERNAL: { id: 'EXTERNAL', label: 'External' },
    }

    this.terminalValueStrategyTypes = {
      NONE: { id: 'NONE', label: 'None' },
      FIXED_MULTIPLIER: { id: 'FIXED_MULTIPLIER', label: 'Net Cash Flow Multiple' },
      EBITDA_MULTIPLE: { id: 'EBITDA', label: 'EBITDA Multiple' },
      PERPUTUAL_GROWTH: { id: 'PERPUTUAL_GROWTH', label: 'Perpetual Growth' },
    }

    this.penetrationAnalysisStrategies = [
      { id: 'SCURVE', label: 'Curve Based' },
      { id: 'FLOW_SHARE', label: 'Flow Share' }
    ]

    this.connectionCostStrategies = [
      { id: 'NEW_CONNECTION', label: 'New Connection' },
      { id: 'REUSE_CONNECTION', label: 'Reuse Connection' },
    ]

    this.calculationTypes = [
      { id: 'IRR', label: 'IRR' },
      { id: 'FIXED', label: 'Fixed' },
      { id: 'PERCENTAGE', label: 'Percentage' }
    ]
  }

  componentDidMount() {
    this.props.reloadRoicManagerConfiguration(this.props.resourceManagerId)
    this.props.setModalTitle(this.props.resourceManagerName)
  }

  static getDerivedStateFromProps(nextProps) {
    return nextProps.roicManagerConfiguration !== undefined
      ? { roicManagerConfiguration: nextProps.roicManagerConfiguration }
      : null
  }

  isCalculationSetting(coverageType) {
    const coverageTypes = this.state.roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.pruningCoverageTypes
    return (
      coverageType === "BOTH" && coverageTypes.length === 2
    ) || (
      coverageTypes.length === 1 && coverageTypes[0] === coverageType
    );
  }

  render() {
    return this.state.roicManagerConfiguration.inputs === undefined
      ? null
      : this.renderRoicEditor()
  }

  renderRoicEditor() {

    const { roicManagerConfiguration, activeTab, selectedRoicModelIndex, speedCategoryHelp } = this.state

    return (
      <>
        {/* Create tabs */}
        <ul className="nav nav-tabs" role="tablist">
          {tabs.map((tabValue, tabKey) => {
            return (
              <li
                key={tabKey}
                role="presentation"
                className={`nav-item ${activeTab === tabValue.key ? 'active' : ''}`}
              >
                <a
                  role="tab"
                  data-toggle="tab"
                  onClick={(event) => this.selectTab(tabValue.key)}
                  className={`nav-link ${activeTab === tabValue.key ? 'active' : ''}`}
                >
                  {tabValue.label}
                </a>
              </li>
            )
          })
          }
        </ul>

        <div className="container"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', marginTop: '10px' }}
        >
          {activeTab === 'roicSettingsConfiguration' &&
            <div className="row">
              <div className="ei-items-contain">
                <div className="ei-foldout">
                  <div className="ei-header" style={{ cursor: 'unset' }}>
                    Financial Constraints
                  </div>
                  <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
                    <div className="ei-items-contain">
                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Cash Flow Strategy Type
                        </div>
                        <div>
                          <select
                            name="cashFlowStrategyType"
                            className="form-control"
                            onChange={(event) => {this.handleConfigChange(event)}}
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration
                                .financialConstraints.cashFlowStrategyType
                            }
                          >
                            {Object.entries(this.cashFlowStrategyTypes).map(([itemKey, item]) => {
                              return (
                                <option key={item.id} value={item.id}>{item.label}</option>
                              )}
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Discount Rate
                        </div>
                        <div>
                          <input
                            name="discountRate"
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration
                                .financialConstraints.discountRate
                            }
                            onChange={(event) => {this.handleConfigChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Starting Year
                        </div>
                        <div>
                          <input
                            name="startYear"
                            value={roicManagerConfiguration.roicSettingsConfiguration.financialConstraints.startYear}
                            onChange={(event) => {this.handleConfigChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Years
                        </div>
                        <div>
                          <input
                            name="years"
                            value={roicManagerConfiguration.roicSettingsConfiguration.financialConstraints.years}
                            onChange={(event) => {this.handleConfigChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Penetration Analysis Strategy
                        </div>
                        <div>
                          <select
                            name="penetrationAnalysisStrategy"
                            className="form-control"
                            onChange={(event) => {this.handleConfigChange(event)}}
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration
                                .financialConstraints.penetrationAnalysisStrategy
                            }
                          >
                            {this.penetrationAnalysisStrategies.map((item) => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Connection Cost Strategy
                        </div>
                        <div>
                          <select
                            name="connectionCostStrategy"
                            className="form-control"
                            onChange={(event) => {this.handleConfigChange(event)}}
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration
                                .financialConstraints.connectionCostStrategy
                            }
                          >
                            {this.connectionCostStrategies.map((item) => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Competition Provider Strength
                        </div>
                        <div>
                          <input
                            name="providerStrength"
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration
                                .competitionConfiguration.providerStrength
                            }
                            onChange={(event) => {this.handleConfigChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>

                      <div className="ei-foldout">
                        <div className="ei-header" style={{ cursor: 'unset' }}>
                          Terminal Value Strategy
                        </div>
                        <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
                          <div className="ei-items-contain">
                            <div className="ei-property-item">
                              <div className="ei-property-label">
                                Plan Terminal Value Type
                              </div>
                              <div>
                                <select
                                  name="terminalValueStrategyType"
                                  className="form-control"
                                  onChange={(event) => {this.handleConfigChange(event)}}
                                  value={
                                    roicManagerConfiguration.roicSettingsConfiguration
                                    .financialConstraints.terminalValueStrategy.terminalValueStrategyType
                                  }
                                >
                                  {Object.entries(this.terminalValueStrategyTypes).map(([itemKey, item]) => {
                                    return (
                                      <option key={item.id} value={item.id}>{item.label}</option>
                                    )}
                                  )}
                                </select>
                              </div>
                            </div>
                            <div className="ei-property-item">
                              <div className="ei-property-label">
                                Value
                              </div>
                              <div>
                                <input
                                  name="value"
                                  value={
                                    roicManagerConfiguration.roicSettingsConfiguration
                                    .financialConstraints.terminalValueStrategy.value
                                  }
                                  onChange={(event) => {this.handleConfigChange(event)}}
                                  className="form-control input-sm"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="ei-items-contain">
                            <div className="ei-property-item">
                              <div className="ei-property-label">
                                BAU Terminal Value Type
                              </div>
                              <div>
                                <select
                                  name="terminalValueStrategyType"
                                  className="form-control"
                                  onChange={(event) => {this.handleBAUChange(event)}}
                                  value={
                                    roicManagerConfiguration.roicSettingsConfiguration
                                    .financialConstraints.bauTerminalValueStrategy.terminalValueStrategyType
                                  }
                                >
                                  {Object.entries(this.terminalValueStrategyTypes).map(([itemKey, item]) => {
                                    return (
                                      <option key={item.id} value={item.id}>{item.label}</option>
                                    )}
                                  )}
                                </select>
                              </div>
                            </div>
                            <div className="ei-property-item">
                              <div className="ei-property-label">
                                Value
                              </div>
                              <div>
                                <input
                                  name="value"
                                  value={
                                    roicManagerConfiguration.roicSettingsConfiguration
                                    .financialConstraints.bauTerminalValueStrategy.value
                                  }
                                  onChange={(event) => {this.handleBAUChange(event)}}
                                  className="form-control input-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          {activeTab === 'subsidyConfiguration' &&
            <div className="row">
              <div className="ei-items-contain">
                <div className="ei-foldout">
                  <div className="ei-header" style={{ cursor: 'unset' }}>
                    Subsidy Configuration
                  </div>
                  <div className="ei-gen-level" style={{ paddingLeft: '21px', paddingRight: '10px' }}>
                    <div className="ei-items-contain">
                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Calculation Setting
                        </div>
                        <form>
                          Use Location Layer
                          <input
                            type="radio"
                            name="pruningCoverageTypes"
                            value="SUBSIDIZED"
                            checked={this.isCalculationSetting("SUBSIDIZED")}
                            onChange={(event) => this.handleSubsidyChange(event)}
                          /><br />
                          Use Dynamic Calculation
                          <input
                            type="radio"
                            name="pruningCoverageTypes"
                            value="ELIGIBLE"
                            checked={this.isCalculationSetting("ELIGIBLE")}
                            onChange={(event) => this.handleSubsidyChange(event)}
                          /><br />
                          Use Both
                          <input
                            type="radio"
                            name="pruningCoverageTypes"
                            value="BOTH"
                            checked={this.isCalculationSetting("BOTH")}
                            onChange={(event) => this.handleSubsidyChange(event)}
                          />
                        </form>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Calculation Type
                        </div>
                        <div>
                        <select
                            name="calcType"
                            className="form-control"
                            onChange={(event) => {this.handleSubsidyChange(event)}}
                            value={
                              roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration
                                .calcType
                            }
                          >
                            {this.calculationTypes.map((item) => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Value (IRR and Percent in decimal | Fixed in Int)
                        </div>
                        <div>
                          <input
                            name="value"
                            value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.value}
                            onChange={(event) => {this.handleSubsidyChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>

                      <div className="ei-property-item">
                        <div className="ei-property-label">
                          Subsidy Range
                        </div>
                        <div>
                          Min
                          <input
                            name="minValue"
                            value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.minValue}
                            onChange={(event) => {this.handleSubsidyChange(event)}}
                            className="form-control input-sm"
                          />
                          Max
                          <input
                            name="maxValue"
                            value={roicManagerConfiguration.roicSettingsConfiguration.subsidyConfiguration.maxValue}
                            onChange={(event) => {this.handleSubsidyChange(event)}}
                            className="form-control input-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          {activeTab === 'inputs' &&
            <div className="row">
              {/* On the left, show a list of ROIC models that the user can edit */}
              <div className="col-md-4">
                <ul className="nav nav-pills flex-column" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {roicManagerConfiguration.inputs.map((roicModel, roicKey) =>
                  <li role="presentation" className="nav-item" key={roicKey}
                    onClick={(event) => this.selectRoicModel(roicKey)}
                  >
                    {/* Show the entity type and speed category */}
                    <div
                      className={`nav-link pill-parent
                      ${selectedRoicModelIndex === roicKey ? 'active' : 'true'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {roicModel.id.entityType} / {roicModel.id.speedCategory}
                      <span
                        className="badge badge-light float-right"
                        onClick={(event) => this.showSpeedCategoryHelp(roicModel.id.speedCategory)}
                        style={{ marginTop: '2px', cursor: 'pointer' }}
                      >
                        <i className="fa fa-question"></i>
                      </span>
                    </div>
                  </li>
                )}
                </ul>
              </div>

              {/* On the right, show the details of the currently selected ROIC model */}
              <div className="col-md-8">
                {/* We will create a flexbox that will show the speed category help only if it is displayed */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                    <table id="tblRoicModel" className="table table-sm table-striped">
                      <tbody>
                        {Object.entries(roicManagerConfiguration.inputs[selectedRoicModelIndex])
                          .map(([itemKey, itemValue], itemIndex) => {
                            if (itemKey !== 'id' && itemKey !== 'penetrationEnd' && itemKey !== 'churnRateDecrease') {
                              return (
                                <tr key={itemIndex}>
                                  <td>{itemKey}</td>
                                  <td>
                                    <input
                                      className="form-control"
                                      name={itemKey}
                                      value={roicManagerConfiguration.inputs[selectedRoicModelIndex][itemKey]}
                                      onChange={e => {this.handleModelsChange(e, selectedRoicModelIndex)}}
                                    />
                                  </td>
                                </tr>
                              )
                            }
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: '0 0 auto', paddingTop: '10px' }}>
                    {speedCategoryHelp &&
                      <div className="alert alert-info alert-dismissible fade show" role="alert">
                        {speedCategoryHelp}
                        <button
                          type="button"
                          className="close"
                          aria-label="Close"
                          onClick={() => this.hideSpeedCategoryHelp()}
                        >
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <div style={{ flex: '0 0 auto' }}>
            <div style={{ textAlign: 'right' }}>
              <button type="button" className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
                <i className="fa fa-undo action-button-icon"></i>Discard changes
              </button>
              <button type="button" className="btn btn-primary" onClick={() => this.saveConfigurationToServer()}>
                <i className="fa fa-save action-button-icon"></i>Save
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  handleBAUChange(event) {
    const { name, value } = event.target
    const { roicManagerConfiguration } = this.state
    roicManagerConfiguration.roicSettingsConfiguration.financialConstraints.bauTerminalValueStrategy[name] = value
    this.setState({ roicManagerConfiguration })
  }

  handleConfigChange(event) {
    const name = event.target.name
    const value = event.target.value
    const pristineRoicModel = this.state.roicManagerConfiguration

    if (name === 'terminalValueStrategyType' || name === 'value') {
      pristineRoicModel.roicSettingsConfiguration.financialConstraints.terminalValueStrategy[name] = value
    } else if (name === 'providerStrength') {
      pristineRoicModel.roicSettingsConfiguration.competitionConfiguration[name] = value
    } else {
      pristineRoicModel.roicSettingsConfiguration.financialConstraints[name] = value
    }

    this.setState({ roicManagerConfiguration: pristineRoicModel })
  }

  handleModelsChange(event, selectedRoicModelIndex) {
    const pristineRoicModel = this.state.roicManagerConfiguration

    const newRoicModel = this.state.roicManagerConfiguration.inputs[selectedRoicModelIndex]
    newRoicModel[event.target.name] = event.target.value

    pristineRoicModel.inputs.map((itemValue, itemKey) => {
      if (itemKey === selectedRoicModelIndex) {
        return { ...pristineRoicModel[selectedRoicModelIndex], newRoicModel }
      }
    })

    this.setState({ roicManagerConfiguration: pristineRoicModel })
  }

  handleSubsidyChange(event) {
    const name = event.target.name
    const value = event.target.value
    const pristineRoicModel = this.state.roicManagerConfiguration

    if (name === 'pruningCoverageTypes') {
      if (value === "BOTH") {
        pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.pruningCoverageTypes = ["ELIGIBLE" , "SUBSIDIZED"]
      } else {
        pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.pruningCoverageTypes = [value]
      }
    } else {
      pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration[name] = value
    }

    this.setState({ roicManagerConfiguration: pristineRoicModel })
  }

  exitEditingMode() {
    this.props.setIsResourceEditor(true)
  }

  saveConfigurationToServer() {
    this.props.saveRoicConfigurationToServer(this.props.roicManager.id, this.state.roicManagerConfiguration)
  }

  showSpeedCategoryHelp(category) {
    this.setState({ speedCategoryHelp: this.speedCategoryHelpObj.speedCategoryHelp[category]
      || this.speedCategoryHelpObj.speedCategoryHelp.default })
  }

  hideSpeedCategoryHelp() {
    this.setState({ speedCategoryHelp: '' })
  }

  selectTab(tabKey) {
    this.setState({ activeTab: tabKey })
  }

  selectRoicModel(index) {
    this.setState({ selectedRoicModelIndex: index })
  }
}

const mapStateToProps = (state) => ({
  roicManager: state.resourceEditor.roicManager,
  roicManagerConfiguration: state.resourceEditor.roicManagerConfiguration,
  editingManager: state.resourceManager.editingManager,
  resourceManagerName: state.resourceManager.editingManager
    && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  resourceManagerId: state.resourceManager.editingManager
    && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerId,
})

const mapDispatchToProps = (dispatch) => ({
  reloadRoicManagerConfiguration: (roicManagerId) => dispatch(
    ResourceActions.reloadRoicManagerConfiguration(roicManagerId)
  ),
  saveRoicConfigurationToServer: (roicManagerId, roicManagerConfiguration) => dispatch(
    ResourceActions.saveRoicConfigurationToServer(roicManagerId, roicManagerConfiguration)
  ),
  setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
})

const RoicEditorComponent = connect(mapStateToProps, mapDispatchToProps)(RoicEditor)
export default RoicEditorComponent
