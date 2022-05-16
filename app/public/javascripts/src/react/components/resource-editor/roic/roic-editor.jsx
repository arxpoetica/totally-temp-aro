import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from '@mantine/core'
import ResourceActions from '../resource-actions'
import ROICSubsidy from './roic-subsidy.jsx'
import ROICModels from './roic-models.jsx'
import ROICConfiguration from './roic-configuration.jsx'

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
    label: 'Subsidies',
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

    this.isCalculationSetting = this.isCalculationSetting.bind(this)
    this.handleConfigChange = this.handleConfigChange.bind(this)
    this.handleBAUChange = this.handleBAUChange.bind(this)
    this.handleSubsidyChange = this.handleSubsidyChange.bind(this)
    this.selectRoicModel = this.selectRoicModel.bind(this)
    this.showSpeedCategoryHelp = this.showSpeedCategoryHelp.bind(this)
    this.handleModelsChange = this.handleModelsChange.bind(this)
    this.hideSpeedCategoryHelp = this.hideSpeedCategoryHelp.bind(this)
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
      <div style={{ display: "flex", flexDirection: "row", background: "#F8F9FA" }}>
        <ul
          style={{
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            flex: "0 0 20%",
            paddingLeft: 0,
            margin: 0,
            borderRadius: "5px"
          }}
        >
          {tabs.map((tabValue, tabKey) => {
            return (
              <li
                key={tabKey}
                style={{
                  background: tabValue.key === activeTab && "#F8F9FA",
                  cursor: "pointer",
                  fontSize: "16px",
                  borderRadius: "5px",
                  listStyle: 'none',
                  margin: "5px 10px",
                  lineHeight: "42px"
                }}
                onClick={() => this.selectTab(tabValue.key)}
              >
                <a
                  role="tab"
                  data-toggle="tab"
                >
                  X {tabValue.label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="container"
          style={{ background: "#FFFFFF", display: 'flex', flexDirection: 'column', height: '100%', marginTop: '10px', marginLeft: "10px", borderRadius: "5px" }}
        >
          {activeTab === 'roicSettingsConfiguration' &&
            <ROICConfiguration
              handleConfigChange={this.handleConfigChange}
              handleBAUChange={this.handleBAUChange}
              roicManagerConfiguration={roicManagerConfiguration}
              cashFlowStrategyTypes={this.cashFlowStrategyTypes}
              penetrationAnalysisStrategies={this.penetrationAnalysisStrategies}
              connectionCostStrategies={this.connectionCostStrategies}
              terminalValueStrategyTypes={this.terminalValueStrategyTypes}
            />
          }

          {activeTab === 'subsidyConfiguration' &&
            <ROICSubsidy
              handleSubsidyChange={this.handleSubsidyChange}
              roicManagerConfiguration={roicManagerConfiguration}
              isCalculationSetting={this.isCalculationSetting}
              calculationTypes={this.calculationTypes}
            />
          }

          {activeTab === 'inputs' &&
            <ROICModels
              selectRoicModel={this.selectRoicModel}
              showSpeedCategoryHelp={this.showSpeedCategoryHelp}
              handleModelsChange={this.handleModelsChange}
              hideSpeedCategoryHelp={this.hideSpeedCategoryHelp}
              speedCategoryHelp={speedCategoryHelp}
              roicManagerConfiguration={roicManagerConfiguration}
              selectedRoicModelIndex={selectedRoicModelIndex}
            />
          }

          <div 
            style={{
              flex: '0 0 auto',
              display: "flex",
              flexDirection: "row",
              position: 'absolute',
              bottom: '32px',
              right: '36px',
              justifyContent: "space-between",
              width: "73%"
            }}
          >
            <p style={{ color: "#717880", lineHeight: "36px", margin: 0 }} onClick={() => this.exitEditingMode()}>
              Discard Changes
            </p>
            <div style={{ display: 'flex' }}>
              <p style={{ color: "#717880", lineHeight: "36px", margin: 0, marginRight: "25px" }} onClick={() => this.exitEditingMode()}>
                Reset Defaults
              </p>
              <Button type="button" onClick={() => this.saveConfigurationToServer()}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
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
