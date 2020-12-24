import React, { Component } from 'react'
import { connect } from 'react-redux'
import AnalysisActions from '../analysis-actions'
import { Line } from 'react-chartjs-2';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const intlNumberFormat = config.intl_number_format || 'en-US'
const currencyCode = config.currency_code || 'USD'
const currencyFormatter = new Intl.NumberFormat(intlNumberFormat, {
  style: 'currency',
  currency: currencyCode,
  minimumFractionDigits: 1
})

export class RoicReportsSmall extends Component {
  constructor (props) {
    super(props)

    this.props.loadNetworkNodeTypesEntity() // Moved from state.js to redux

    this.config = config // Ugh - A global from a time long ago!

    this.state = {
      FIBER_STRINGS: this.props.enumStrings['com.altvil.aro.service.entity']['FiberType'],
      CABLE_CONSTRUCTION_STRINGS: this.props.enumStrings['com.altvil.interfaces']['CableConstructionEnum'],
      selectedEntityType: this.props.entityTypes.filter(item => item.id === 'network')[0],
      selectedNetworkType: this.props.networkTypes.filter(item => item.id === 'planned_network')[0],
      selectedCategory: this.props.categories[1],
      selectedCalcType: this.props.categories[1].calcTypes[0]
    }
  }

  render () {
    return Object.keys(this.props.networkNodeTypesEntity).length === 0 ? null : this.renderRoicReportsSmall()
  }

  renderRoicReportsSmall () {

    const { roicResults, networkEquipment, networkNodeTypesEntity, networkTypes,
      categories, entityTypes, graphOptions } = this.props
    const { FIBER_STRINGS, CABLE_CONSTRUCTION_STRINGS, selectedEntityType,
      selectedNetworkType, selectedCategory, selectedCalcType } = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{flex: '0 0 auto'}}>
          <h3 className="mb-3 mt-3">Summary</h3>
        </div>
        <div style={{flex: '0 0 auto'}}>
          <table id="tblNetworkBuildOutput" className="table table-sm table-striped">
            <tbody>
              {roicResults.networkStatistics.map((networkStatistic, index) => {
                return (
                  <tr key={index}>
                    {networkStatistic.networkStatisticType === 'roic_npv' &&
                      <>
                        <td>
                          {networkStatistic.networkStatisticType === 'roic_npv' &&
                            <strong>NPV</strong>
                          }
                        </td>
                        <td>
                          {networkStatistic.networkStatisticType === 'roic_npv' &&
                            currencyFormatter.format((networkStatistic.value / 1000).toFixed(1)) + ' K'
                          }
                        </td>
                      </>
                    }
                  </tr>
                )}
              )}

              {roicResults.networkStatistics.map((networkStatistic, index) => {
                return (
                  <tr key={index}>
                    {networkStatistic.networkStatisticType === 'roic_irr' &&
                      <>
                        <td>
                          {networkStatistic.networkStatisticType === 'roic_irr' &&
                            <strong>IRR</strong>
                          }
                        </td>
                        <td>
                          {networkStatistic.networkStatisticType === 'roic_irr' &&
                            (networkStatistic.value * 100).toFixed(1) + ' %'
                          }
                        </td>
                      </>
                    }
                  </tr>
                )}
              )}         

              <tr>
                <td><strong>Total Capex</strong></td>
                <td>{currencyFormatter.format((roicResults.priceModel.totalCost / 1000).toFixed(1)) + ' K'}</td>
              </tr>

              <tr>
                <td colSpan="2"><strong>Fiber Capex</strong></td>
              </tr>
              {roicResults.priceModel.fiberCosts.map((fiberCost, index) => {
                return (
                  <tr key={index}>
                    <td className="indent-1 text-capitalize">
                      {FIBER_STRINGS[fiberCost.fiberType]} -&nbsp;
                      {CABLE_CONSTRUCTION_STRINGS[fiberCost.edgeFeatureType + '.' + fiberCost.edgeConstructionType]}
                      ({Math.round((fiberCost.lengthMeters * this.config.length.meters_to_length_units))}&nbsp;
                      {this.config.length.length_units})
                    </td>
                    <td>{currencyFormatter.format((fiberCost.totalCost / 1000).toFixed(1)) + ' K'}</td>
                  </tr>
                )}
              )}

              <tr>
                <td colSpan="2"><strong>Equipment Capex</strong></td>
              </tr>
              {roicResults.priceModel.equipmentCosts.map((equipmentCost, index) => {
                return (
                  <tr key={index}>
                    <td className="indent-1 text-capitalize">
                      {networkNodeTypesEntity[equipmentCost.nodeType] || networkEquipment.equipments[equipmentCost.nodeType].label} (x{(equipmentCost.quantity).toFixed(0)})
                    </td>
                    <td>{currencyFormatter.format((equipmentCost.total / 1000).toFixed(1)) + ' K'}</td>
                  </tr>
                )}
              )}

              {/* plannedNetworkDemand does not assigned or received from any where of the app, so condition is implemented to avoid error while rendering */}
              {this.props.plannedNetworkDemand !== undefined
                 ? Object.entries(this.props.plannedNetworkDemand.locationDemand.entityDemands).map(([key, value], index) => {
                    return (
                      <tr key={index}>
                        {key === 'small' || key === 'medium' || key === 'large' &&
                          <td className="indent-1 text-capitalize"> {key} Business </td>
                        }
                        {key === 'household' || key === 'celltower' &&
                          <td className="indent-1 text-capitalize"> {key} </td>
                        }
                        <td>{(value.rawCoverage).toFixed(0)}</td>
                      </tr>
                    )
                  })
                : <tr></tr>
              }
            </tbody>
          </table>
        </div>

        <div style={{flex: '0 0 auto'}}>
          <h3 className="pb-3 pt-3" style={{borderTop: '1px solid lightgray'}}>Financial Details</h3>
        </div>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Network Type</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e) => this.handleNetworkTypeChange(e)} value={selectedNetworkType.id}>
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Group</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e) => this.handleCategoriesChange(e)} value={selectedCategory.id}>
                {categories.filter((categorie) => categorie.id !== 'summary')
                  .map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>  

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Metric</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e) => this.handleCalcTypeChange(e)} value={selectedCalcType.id}>
                  {selectedCategory.calcTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Entity Type</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e) => this.handleEntityTypeChange(e)} value={selectedEntityType.id}>
                  {entityTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>            
          </form>
        </div>

        <div style={{flex: '1 1 auto'}}>
          {/* If we have chart data, show it */}
          {/* roicResults.roicAnalysis.components does not has values, so condition is implemented to avoid error while rendering */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id] !== undefined &&
              <Line
                display={'block'} width={250} height={533}
                data={this.updateDataSet()}
                options={graphOptions[selectedCalcType.id]}
              />
            : ''
          }
        </div>

        <div style={{flex: '1 1 auto'}}>
          {/* <!-- If we do not have chart data, display a warning --> */}
          {/* roicResults.roicAnalysis.components does not has values, so condition is implemented to avoid error while rendering */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id] === undefined &&
                <div className="alert alert-warning" role="alert">
                  No data available for the selected combination of Network Type, Entity Type and Calculation Type.
                </div>
            : ''
          }
        </div>
      </div>
    )
  }

  updateDataSet () {

    const { roicResults, dataSetProps, timeLabels } = this.props
    const { selectedEntityType, selectedNetworkType, selectedCalcType } = this.state

    return {
      labels:timeLabels,
      datasets: [
        {
          data: roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id].values,
          fill: dataSetProps.fill,
          pointBackgroundColor:dataSetProps.pointBackgroundColor,
          pointHoverBackgroundColor: dataSetProps.pointHoverBackgroundColor
        }
      ]
    }
  }

  handleNetworkTypeChange (e) {
    const selectedNetworkType = this.props.networkTypes.find(item => item.id === e.target.value);
    this.setState({ selectedNetworkType })
  }

  handleCategoriesChange (e) {
    const selectedCategory = this.props.categories.find(item => item.id === e.target.value);
    this.setState({ selectedCategory, selectedCalcType: selectedCategory.calcTypes[0] })
  }

  handleCalcTypeChange (e) {
    const selectedCalcType = this.state.selectedCategory.calcTypes.find(item => item.id === e.target.value);
    this.setState({ selectedCalcType })
  }

  handleEntityTypeChange (e) {
    const selectedEntityType = this.props.entityTypes.find(item => item.id === e.target.value);
    this.setState({ selectedEntityType })
  }
}

const mapStateToProps = (state) => ({
  enumStrings: state.analysisMode.enumStrings,
  networkEquipment: state.mapLayers.networkEquipment,
  networkNodeTypesEntity: state.analysisMode.networkNodeTypesEntity,
  roicResults: state.analysisMode.roicResults
})

const mapDispatchToProps = (dispatch) => ({
  loadNetworkNodeTypesEntity: () => dispatch(AnalysisActions.loadNetworkNodeTypesEntity())
})

const RoicReportsSmallComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsSmall)
export default RoicReportsSmallComponent