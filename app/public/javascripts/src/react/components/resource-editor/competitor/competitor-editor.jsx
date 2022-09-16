import React, { Component } from 'react'
import { connect } from 'react-redux'
import { MultiSelect, Button, Slider, NumberInput } from '@mantine/core'
import { IconClick, IconArrowBack, IconPercentage } from '@tabler/icons'
import { CompetitorButtons } from './competitor-buttons.jsx'
import ResourceActions from '../resource-actions'
import AroHttp from '../../../common/aro-http'
import { RECALC_STATES } from './competitor-shared'
import cx from 'clsx'

class _CompetitorEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedRegions: [],
      regionSelectEnabled: true,
      isClearable: true,
      isDisabled: false,
      prominenceThreshold: 2.0,
      openTab: 0,
      strengthsById: '',
      hasChanged: false,
    }
  }

  async componentDidMount () {
    this.props.getRegions()
    this.props.setModalTitle(this.props.resourceManagerName)
    const { id } = this.props.editingManager
    const url = `/service/v2/resource-manager/${id}/competition_manager`
    const { data } = await AroHttp.get(url)
    this.props.setRecalcState(data.state)
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.loadStrength.strengthsById !== undefined) {
      return {
        strengthsById: nextProps.loadStrength.strengthsById,
      }
    } else {
      return null
    }
  }

  render () {
    const regionsList = this.props.regions && this.props.regions.map(regionValue => {
      return { value: regionValue.gid, label: regionValue.name }
    }) || []

    return (
      <div>
        <div className={cx(this.props.recalcState === RECALC_STATES.RECALCULATING && 'recalculating')}>
          <strong>Regions</strong>
          <div className="region-section">
            <MultiSelect
              data={regionsList}
              value={this.state.selectedRegions}
              clearButtonLabel="Clear selection"
              placeholder="Select data sources..."
              onChange={selectedRegions => this.setState({ selectedRegions })}
              disabled={this.state.isDisabled}
              searchable
              clearable
            />
            {!this.state.regionSelectEnabled &&
              <Button
                onClick={(event) => this.reselectRegion(event)}
                leftIcon={<IconArrowBack size={20} stroke={2}/>}
                variant="outline"
              >
                Reselect
              </Button>
            }
            {this.state.regionSelectEnabled &&
              <Button
                onClick={(event) => this.onRegionsSelect(event)}
                leftIcon={<IconClick size={20} stroke={2}/>}
                disabled={this.state.selectedRegions.length < 1}
              >
                Select
              </Button>
            }
          </div>
          <div style={{marginTop: '-15px'}}>
            {this.state.regionSelectEnabled &&
              <Button
                onClick={(event) => this.handleSelectAllRegions(event)}
                leftIcon={<IconClick size={20} stroke={2}/>}
                variant="subtle"
              >
                Select All
              </Button>
            }
          </div>

          {!this.state.regionSelectEnabled &&
            <div>
              <strong>Coverage Threshold</strong>
              <div className="slider-section">
                <Slider
                  label={null}
                  value={this.state.prominenceThreshold}
                  onChange={prominenceThreshold => this.setState({ prominenceThreshold })}
                  min={0}
                  max={100}
                  step={0.1}
                />
                <div className="slider-input">
                  <NumberInput
                    value={this.state.prominenceThreshold}
                    onChange={prominenceThreshold => this.setState({ prominenceThreshold })}
                    step={0.1}
                  />
                  <IconPercentage size={20} stroke={2}/>
                </div>
              </div>
            </div>
          }

          {!this.state.regionSelectEnabled &&
            <div>
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <a className={`nav-link ${this.state.openTab === 0 ? 'active' : ''}`}
                    onClick={(event) => this.handleOpenTab(0)} href="#"
                  >Above Threshold</a>
                </li>
                <li className="nav-item">
                <a className={`nav-link ${this.state.openTab === 1 ? 'active' : ''}`}
                    onClick={(event) => this.handleOpenTab(1)} href="#"
                  >Below Threshold</a>
                </li>
              </ul>

              {this.state.openTab === 0 &&
                <div>
                  <div className="comp_edit_tbl_contain">
                    <table className="table table-sm table-striped">
                      <thead className="thead-dark">
                        <tr>
                          <th>Carrier</th>
                          <th>Coverage</th>
                          {
                            this.props.loadStrength.strengthCols
                            && this.props.loadStrength.strengthCols.map((providerType, providerKey) =>
                              <th key={providerKey} className="comp_edit_center_label">{providerType}</th>
                            )
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {
                        this.props.carriersByPct.filter((carrierValue) =>
                        carrierValue.cbPercent >= this.state.prominenceThreshold)
                        .map((carrierValue, carrierKey) =>
                          <tr key={carrierKey}>
                            <td>{carrierValue.alias}</td>
                            <td>{this.truncateNum(carrierValue.cbPercent, 1)}%</td>
                            {
                              this.props.loadStrength.strengthCols
                              && this.props.loadStrength.strengthCols.map((providerType, providerKey) =>
                                <td key={providerKey}>
                                  {!!this.state.strengthsById[carrierValue.carrierId][providerType] &&
                                    <div className="comp_edit_input_set" >
                                      <input
                                        type="text"
                                        className="form-control comp_edit_percent_item"
                                        value={this.state.strengthsById[carrierValue.carrierId][providerType].strength}
                                        onChange={(event) => this.handleStrengthChange(
                                          event, this.state.strengthsById, carrierValue.carrierId, providerType
                                        )}
                                      />
                                    </div>
                                  }
                                </td>
                              )
                            }
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              {this.state.openTab === 1 &&
                <div>
                  <div className="comp_edit_tbl_contain">
                    <table className="table table-sm table-striped">
                      <thead className="thead-dark">
                        <tr>
                          <th>Carrier</th>
                          <th>Coverage</th>
                          {
                            this.props.loadStrength.strengthCols
                            && this.props.loadStrength.strengthCols.map((providerType, providerKey) =>
                              <th key={providerKey} className="comp_edit_center_label">{providerType}</th>
                            )
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {
                        this.props.carriersByPct.filter((carrierValue) =>
                        carrierValue.cbPercent < this.state.prominenceThreshold)
                        .map((carrierValue, carrierKey) =>
                          <tr key={carrierKey}>
                            <td>{carrierValue.alias}</td>
                            <td>{this.truncateNum(carrierValue.cbPercent, 1)}%</td>
                            {
                              this.props.loadStrength.strengthCols
                              && this.props.loadStrength.strengthCols.map((providerType, providerKey) =>
                                <td key={providerKey}>
                                  {!!this.state.strengthsById[carrierValue.carrierId][providerType] &&
                                    <div className="comp_edit_input_set" >
                                      <input
                                        type="text"
                                        className="form-control comp_edit_percent_item"
                                        value={this.state.strengthsById[carrierValue.carrierId][providerType].strength}
                                        onChange={(event) => this.handleStrengthChange(
                                          event, this.state.strengthsById, carrierValue.carrierId, providerType
                                        )}
                                      />
                                    </div>
                                  }
                                </td>
                              )
                            }
                          </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <CompetitorButtons
          recalcState={this.props.recalcState}
          exitEditingMode={this.exitEditingMode.bind(this)}
          executeRecalc={this.props.executeRecalc}
          loggedInUserId={this.props.loggedInUser.id}
          editingManagerId={this.props.editingManager.id}
          hasChanged={this.state.hasChanged}
          saveConfigurationToServer={this.saveConfigurationToServer.bind(this)}
          regionSelectEnabled={this.state.regionSelectEnabled}
        />

        {/* TODO: move classes / styles into here: */}
        <style jsx>{`
          .recalculating {
            pointer-events: none;
            opacity: 0.25;
          }
          .region-section {
            display: grid;
            grid-template-columns: 1fr 150px;
            gap: 10px;
            margin-bottom: 20px;
          }
          .slider-section {
            display: grid;
            grid-template-columns: 1fr 150px;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }
          .slider-input {
            display: flex;
            grid-template-columns: 75px 1fr;
            gap: 8px;
            align-items: center;
          }
          .table td {
            line-height: 33px;
          }
          #comp_edit_region_select_list {
            padding-top: 2px;
          }
          .comp_edit_percent_item {
            width: 6em;
          }
          .comp_edit_input_set {
            white-space: nowrap;
            text-align: right;
          }
          .comp_edit_input_set input {
            display: inline-block;
          }
          .comp_edit_center_label {
            text-align: center;
          }
        `}</style>
      </div>
    )
  }

  exitEditingMode() {
    this.props.onDiscard()
  }

  saveConfigurationToServer() {
    this.props.saveCompManConfig(
      this.props.editingManager.id,
      this.props.loadStrength.pristineStrengthsById,
      this.state.strengthsById,
    )
    this.setState({ hasChanged: false })
  }

  handleStrengthChange(e, strengthObj, carrierId, providerType){
    strengthObj[carrierId][providerType].strength = e.target.value
    this.setState({ strengthsById: strengthObj, hasChanged: true })
  }

  truncateNum (num, digits) {
    const scale = Math.pow(10, digits)
    return Math.round(num * scale) / scale
  }

  handleOpenTab(tabValue) {
    this.setState({ openTab: tabValue })
  }

  handleRangeChange(event) {
    this.setState({ prominenceThreshold: event.target.value })
  }

  reselectRegion() {
    if (this.state.hasChanged === true) {
      swal({
        title: 'Unsaved Changes',
        text: 'Do you want to save your changes?',
        type: 'warning',
        confirmButtonColor: '#DD6B55',
        confirmButtonText: 'Save', // 'Yes',
        showCancelButton: true,
        cancelButtonText: 'Discard', // 'No',
        closeOnConfirm: true
      }, (result) => {
        if (result) {
          this.saveConfigurationToServer()
        }
      })
    }

    this.setState({
      regionSelectEnabled: true,
      isClearable: true,
      selectedRegions: [],
      isDisabled: false,
      hasChanged: false,
    })
  }

  async onRegionsSelect() {
    const regionsString = this.props.regions
      .filter(region => this.state.selectedRegions.includes(region.gid))
      .map(region => region.stusps)
      .join(',')

    await this.props.loadCompManForStates(
      this.props.editingManager.id,
      regionsString,
      this.props.loggedInUser,
    )

    this.setState({
      regionSelectEnabled: false,
      isClearable: false,
      isDisabled: true,
    })
  }

  handleSelectAllRegions() {
    const selectedRegions = this.props.regions.map(region => region.gid)
    this.setState({ selectedRegions })
  }
}

const mapStateToProps = (state) => ({
  regions: state.resourceEditor.regions,
  carriersByPct: state.resourceEditor.carriersByPct,
  loggedInUser: state.user.loggedInUser,
  loadStrength: state.resourceEditor.loadStrength,
  editingManager: state.resourceManager.editingManager,
  compManMeta: state.resourceEditor.compManMeta,
  resourceManagerName: state.resourceManager.editingManager
    && state.resourceManager.managers[state.resourceManager.editingManager.id].resourceManagerName,
  recalcState: state.resourceEditor.recalcState
})

const mapDispatchToProps = (dispatch) => ({
  getRegions: () => dispatch(ResourceActions.getRegions()),
  loadCompManForStates: (...args) => dispatch(ResourceActions.loadCompManForStates(...args)),
  saveCompManConfig: (...args) => dispatch(ResourceActions.saveCompManConfig(...args)),
  setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
  loadCompManMeta: (competitorManagerId) => dispatch(ResourceActions.loadCompManMeta(competitorManagerId)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title)),
  setRecalcState: (recalc) => dispatch(ResourceActions.setRecalcState(recalc)),
  executeRecalc: (userId, competitorManagerId) => dispatch(ResourceActions.executeRecalc(userId, competitorManagerId)),
})

export const CompetitorEditor = connect(mapStateToProps, mapDispatchToProps)(_CompetitorEditor)
