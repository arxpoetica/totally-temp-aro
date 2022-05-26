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

    this.defaultSubsidy = {
      subsidyConfiguration: {
        pruningCoverageTypes: [],
        calcType: "IRR",
        value: 20,
        minValue: 0,
        maxValue: 500000000
      }
    }

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

  handleSubsidyChange(event, name) {
    name = event && event.target ? event.target.name : name
    const value = event && event.target ? event.target.value : event
    const pristineRoicModel = this.state.roicManagerConfiguration
    let pruningCoverageTypes = pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.pruningCoverageTypes;
    if (name === 'pruningCoverageTypes') {
      if (value === "BOTH") {
        pruningCoverageTypes = ["ELIGIBLE" , "SUBSIDIZED"]
      } else {
        pruningCoverageTypes = [value]
      }
    } else if (name === 'disableSubsidy') {
      pruningCoverageTypes = event.target.checked ? ["ELIGIBLE"] : [];
    } else {
      pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration[name] = value
    }

    pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.pruningCoverageTypes = pruningCoverageTypes;
    this.setState({ roicManagerConfiguration: pristineRoicModel })
  }

  exitEditingMode() {
    this.props.setIsResourceEditor(true)
  }

  setSubsidyDefaults() {
    const pristineRoicModel = this.state.roicManagerConfiguration
    pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration = this.defaultSubsidy.subsidyConfiguration;
    
    this.setState({ roicManagerConfiguration: pristineRoicModel })
  }
  
  saveConfigurationToServer() {
    const pristineRoicModel = this.state.roicManagerConfiguration
    const value = pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.value
    const calcType = pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.calcType

    if (calcType !== 'FIXED' && value >= 1) {
      pristineRoicModel.roicSettingsConfiguration.subsidyConfiguration.value = value / 100
    }
    this.props.saveRoicConfigurationToServer(this.props.roicManager.id, pristineRoicModel)
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

  render() {
    return this.state.roicManagerConfiguration.inputs === undefined
      ? null
      : this.renderRoicEditor()
  }

  renderRoicEditor() {

    const { roicManagerConfiguration, activeTab, selectedRoicModelIndex, speedCategoryHelp } = this.state

    return (
      <div className="roic-modal">
        <ul className="nav-list">
          {tabs.map((tabValue, tabKey) => {
            return (
              <li
                key={tabKey}
                style={{ background: tabValue.key === activeTab && "#F8F9FA" }}
                className="nav-item-wrapper"
                onClick={() => this.selectTab(tabValue.key)}
              >
                <a
                  role="tab"
                  data-toggle="tab"
                  className="nav-item"
                >
                  <div className={"nav-icon " + tabValue.key} /> {tabValue.label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="container roic-contents">
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

          <div className='roic-footer'>
            <p className="footer-item" style={{ cursor: 'pointer' }} onClick={() => this.exitEditingMode()}>
              Discard Changes
            </p>
            <div style={{ display: 'flex' }}>
              {activeTab === 'subsidyConfiguration' &&
                <p className="footer-item" style={{ marginRight: "25px", cursor: 'pointer' }} onClick={() => this.setSubsidyDefaults()}>
                  Reset Defaults
                </p>
              }
              <Button type="button" onClick={() => this.saveConfigurationToServer()}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .roic-modal {
            display: flex;
            flex-direction: row;
            background: #F8F9FA; 
          }
          .nav-icon {
            background: none no-repeat center transparent;
            width: 18px;
            height: 18px;
            margin-right: 6%;
          }
          .inputs {
            background-image: url('/svg/roic-models.svg');
          }
          .roicSettingsConfiguration {
            background-image: url('/svg/roic-configuration.svg');
          }
          .subsidyConfiguration {
            background-image: url('/svg/roic-subsidies.svg');
          }
          .nav-item {
            display: flex;
            align-items: center;
          }
          .nav-item-wrapper {
            cursor: pointer;
            font-size: 16px;
            border-radius: 5px;
            list-style: none;
            margin: 5px 10px;
            line-height: 42px;
          }   

          .nav-list {
            background: #FFFFFF;
            display: flex;
            flex-direction: column;
            flex: 0 0 20%;
            padding-left: 0;
            margin: 0;
            border-radius: 5px;
          }
          .roic-contents {
            display: flex;
            flex-direction: column;
            height: 100%;
            margin-left: 10px;
            border-radius: 5px;
          }
          .roic-footer {
            flex: 0 0 auto;
            display: flex;
            flex-direction: row;
            position: absolute;
            bottom: 32px;
            right: 36px;
            justify-content: space-between;
            width: 73%;
          }

          .footer-item {
            color: #717880;
            line-height: 36px;
            margin: 0 ;
          }
        `}</style>
      </div>
    )
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
