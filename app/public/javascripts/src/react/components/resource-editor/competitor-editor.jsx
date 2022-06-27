import React, { Component } from 'react'
import { connect } from 'react-redux'
import ResourceActions from './resource-actions'
import Select from "react-select"
import { Alert } from '@mantine/core';

const styles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, backgroundColor: 'gray' } : base
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, fontWeight: 'bold', color: 'white', paddingRight: 6 }
      : base
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: 'none' } : base
  },
}

const orderOptions = values => {
  return values.filter(v => v.isFixed).concat(values.filter(v => !v.isFixed))
}

const recalcStateMap = {
  CLEAN: "clean",
  REQUIRE_RECALC: "requireRecalc",
  RECALCING: "recalcing",
  RECALCULATED: "recalculated"
}

export class CompetitorEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedRegions: '',
      regionSelectEnabled: true,
      isClearable: true,
      isDisabled: false,
      prominenceThreshold: 2.0,
      openTab: 0,
      strengthsById: '',
      hasChanged: false,
      recalcState: recalcStateMap.CLEAN,
    }
  }

  componentDidMount () {
    this.props.getRegions()
    this.props.setModalTitle(this.props.resourceManagerName)
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
    const regionsList = this.props.regions && this.props.regions.map(function(regionValue) {
      return {"id": regionValue.gid, "value": regionValue.stusps, "label": regionValue.name}
    })

    return (
      <div>
        <strong>Regions</strong>
        <div className="comp_edit_flex_section">
          <div className="comp_edit_filter_row_left" id="comp_edit_region_select_list">
            <Select
              isMulti
              styles={styles}
              closeMenuOnSelect={true}
              value={this.state.selectedRegions}
              options={regionsList}
              hideSelectedOptions={true}
              backspaceRemovesValue={false}
              isSearchable={true}
              isClearable={this.state.isClearable}
              isDisabled={this.state.isDisabled}
              placeholder="Select data sources..."
              onChange={(event) => this.handleRegionsChange(event)}
            />
            <div style={{marginTop: '4px'}}>
              {this.state.regionSelectEnabled &&
                <button className="btn btn-primary nowrap_label" onClick={(event) => this.handleSelectAllRegions(event)}>
                  <i className="fa fa-check action-button-icon"></i> Select All
                </button>
              }
            </div>
          </div>

          <div className="comp_edit_filter_row_right" id="comp_edit_region_btn">
            {!this.state.regionSelectEnabled &&
              <button className="btn btn-light nowrap_label" onClick={(event) => this.reselectRegion(event)}>
                <i className="fa fa-undo action-button-icon"></i> Reselect
              </button>
            }
            {this.state.regionSelectEnabled &&
              <button
                className="btn btn-primary nowrap_label"
                onClick={(event) => this.onRegionCommit(event)}
                disabled={this.state.selectedRegions.length < 1}
              >
                <i className="fa fa-save action-button-icon"></i> Select
              </button>
            }
          </div>
        </div>

        {!this.state.regionSelectEnabled &&
          <div>
            <strong>Coverage Threshold</strong>
            <div className="comp_edit_flex_section">
              <div className="comp_edit_filter_row_left">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={this.state.prominenceThreshold}
                  onChange={(event) => this.handleRangeChange(event)}
                  style={{marginTop: '10px', width:'100%'}}/>
              </div>
              <div className="comp_edit_filter_row_right">
                <div className="comp_edit_percent_item">
                  <div className="input-group input-group-sm">
                    <input id="coverageTargetValue"
                      type="number" step="0.1"
                      value={this.state.prominenceThreshold}
                      onChange={(event) => this.handleRangeChange(event)}
                      className="form-control text-right"
                      />
                    <div className="input-group-addon">%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        {
          this.state.recalcState === recalcStateMap.REQUIRE_RECALC &&  <Alert title="Some changes occured" color="yellow">
            Some changes occured, Needs to be recalculated!
          </Alert>
        }

        {
          this.state.recalcState === recalcStateMap.RECALCING && <Alert title="Recalculation in Progress" color="yellow">
            Recalculation is in Progress, It might take some time!
          </Alert>
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
                  <table id="tblCompetitorModel" className="table table-sm table-striped">
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
                  <table id="tblCompetitorModel" className="table table-sm table-striped">
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
        <div style={{flex: '0 0 auto'}}>
          <div style={{textAlign: 'right', paddingTop: '15px'}}>
            <button className="btn btn-light mr-2" onClick={() => this.exitEditingMode()}>
              <i className="fa fa-undo action-button-icon"></i> Discard changes
            </button>
            {
              this.state.hasChanged && this.state.recalcState === recalcStateMap.REQUIRE_RECALC && 
              <button 
                className="btn btn-primary mr-2" 
                onClick={() => {
                  this.setState({ recalcState: recalcStateMap.RECALCING, hasChanged: false })

                  // TODO-  need to call a recalcing api 
                  // after recalcing api get finished
                  // TODO - this.setState({ recalcState: recalcStateMap.CLEAN })

                  setTimeout(()=>{
                    this.setState({ recalcState: recalcStateMap.CLEAN })
                  },5000)
                }}>
                <i className="fa fa-undo action-button-icon"></i> Recalc
              </button>
            }
            <button
              className="btn btn-primary"
              onClick={() => {
                if(!this.state.hasChanged) return

                this.saveConfigurationToServer()

                if(this.state.recalcState === recalcStateMap.CLEAN){
                  this.setState({ recalcState: recalcStateMap.REQUIRE_RECALC })
                }
              }}
              disabled={ this.state.regionSelectEnabled }>
              <i className="fa fa-save action-button-icon"></i> Save
            </button>
          </div>
        </div>
    </div>
    )
  }

  exitEditingMode(){
    this.props.onDiscard()
  }

  saveConfigurationToServer(){
    this.props.saveCompManConfig(this.props.editingManager.id,
      this.props.loadStrength.pristineStrengthsById, this.state.strengthsById
    ) 
  }

  handleStrengthChange(e, strengthObj, carrierId, providerType){
    strengthObj[carrierId][providerType].strength = e.target.value
    this.setState({ strengthsById: strengthObj, hasChanged : true })
  }

  truncateNum (num, digits) {
    const scale = Math.pow(10, digits)
    return Math.round(num * scale) / scale
  }

  handleOpenTab(tabValue){
    this.setState({ openTab: tabValue })
  }

  handleRangeChange(event){
    this.setState({ prominenceThreshold: event.target.value })
  }

  reselectRegion(){
    const enableOption = this.state.selectedRegions
    enableOption.map((item) => item.isFixed = false)

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

    this.setState({ regionSelectEnabled: true, isClearable: true,
      selectedRegions: enableOption, isDisabled: false, hasChanged: false })
  }

  onRegionCommit(){
    this.props.loadCompManForStates(this.props.editingManager.id, this.state.selectedRegions, this.props.loggedInUser)
    const disableOption = this.state.selectedRegions.map(function(regionValue) {
      const object = Object.assign({}, regionValue)
      object.isFixed = true
      return object
    })
    setTimeout(function () {
      this.setState({ regionSelectEnabled: false, isClearable: false,
        selectedRegions: disableOption, isDisabled: true })
    }.bind(this), 1000)
  }

  handleRegionsChange(regions) {
    let formattedRegionsList = []
    if (regions) {
      formattedRegionsList = regions.map(function(regionValue) {
        return {"id":regionValue.id, "value": regionValue.value, "label": regionValue.value}
      })
    }
    this.setState({ selectedRegions: formattedRegionsList })
  }

  handleSelectAllRegions(){
    const regionsList = this.props.regions.map(function(regionValue) {
      return {"id":regionValue.gid, "value": regionValue.stusps, "label": regionValue.stusps}
    })
    const selectedRegions = JSON.parse(JSON.stringify(regionsList))
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
})

const mapDispatchToProps = (dispatch) => ({
  getRegions: () => dispatch(ResourceActions.getRegions()),
  loadCompManForStates: (competitorManagerId, selectedRegions, loggedInUser) => dispatch(
    ResourceActions.loadCompManForStates(competitorManagerId, selectedRegions, loggedInUser)
  ),
  saveCompManConfig: (competitorManagerId, pristineStrengths, newStrengths) => dispatch(
    ResourceActions.saveCompManConfig(competitorManagerId, pristineStrengths, newStrengths)
  ),
  setIsResourceEditor: (status) => dispatch(ResourceActions.setIsResourceEditor(status)),
  loadCompManMeta: (competitorManagerId) => dispatch(ResourceActions.loadCompManMeta(competitorManagerId)),
  setModalTitle: (title) => dispatch(ResourceActions.setModalTitle(title))
})

const CompetitorEditorComponent = connect(mapStateToProps, mapDispatchToProps)(CompetitorEditor)
export default CompetitorEditorComponent