import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Line } from 'react-chartjs-2';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const intlNumberFormat = config.intl_number_format || 'en-US'
const currencyCode = config.currency_code || 'USD'
const currencyFormatter = new Intl.NumberFormat(intlNumberFormat, {
  style: 'currency',
  currency: currencyCode,
  minimumFractionDigits: 1
})

export class RoicReportsLarge extends Component {
  constructor (props) {
    super(props)

    this.config = config // Ugh - A global from a time long ago!

    this.state = {
      FIBER_STRINGS: this.props.enumStrings['com.altvil.aro.service.entity']['FiberType'],
      CABLE_CONSTRUCTION_STRINGS: this.props.enumStrings['com.altvil.interfaces']['CableConstructionEnum'],
      selectedNetworkType: this.props.networkTypes.filter(item => item.id === 'planned_network')[0],
      selectedEntityType: this.props.entityTypes.filter(item => item.id === 'medium')[0],
      selectedCategory: this.props.categories[0],
      shouldRenderCharts: false
    }
  }

  componentDidMount () {
    this.selectCategory(this.props.categories[0])
  }

  render () {

    const { roicResults, networkEquipment, networkNodeTypesEntity, networkTypes,
      categories, entityTypes, graphOptions } = this.props

    const { FIBER_STRINGS, CABLE_CONSTRUCTION_STRINGS, selectedEntityType,
      selectedNetworkType, selectedCategory, shouldRenderCharts } = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-2">Network Type</div>
              <div className="col-sm-4">
                <select className="form-control" onChange={(e) => this.handleNetworkTypeChange(e)} value={selectedNetworkType.id}>
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
              <div className="col-sm-2 roic-report-label">Entity Type</div>
              <div className="col-sm-4">
                <select className="form-control" onChange={(e) => this.handleEntityTypeChange(e)} value={selectedEntityType.id}>
                  {entityTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div style={{flex: '0 0 auto'}}>
          <ul className="nav nav-tabs">
            {categories.map((category, index) =>
              <li className="nav-item" key={index}>
                <a className={`nav-link ${selectedCategory.id === category.id ? 'active' : ''}`}
                    href="#" onClick={(e) => this.selectCategory(category)}>{category.description}</a>
              </li>
            )}
          </ul>
        </div>

        {/* In "Summary" mode do not display graphs */}
        {selectedCategory.id === 'summary' &&
          <div className="m-4" style={{flex: '1 1 auto', position: 'relative', overflowY: 'auto'}}>
            <div className="container">
              <table id="tblRoicReportsLargeSummary" className="table table-sm table-striped">
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
          </div>
        }

        {/* Show the graphs section only if we are not in "Summary" mode */}
          {/* roicResults.roicAnalysis.components does not has values, so condition is implemented to avoid error while rendering (need to be removed) */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? selectedCategory.id !== 'summary' &&
            <div style={{flex: '1 1 auto', position: 'relative'}}>
              {/* Even Index */}
              <div style={{display: 'flex', flexDirection: 'column', position: 'absolute', width: '50%', height: '100%'}}>
                {selectedCategory.calcTypes.map((calcType, index) => {
                  if(index % 2 === 0) {
                    return (
                      <div key={index} style={{flex: '1 1 auto', width: '100%', position: 'relative'}}>
                        <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'absolute'}}>
                          <div style={{flex: '1 1 auto'}}>
                            {roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id] !== undefined && shouldRenderCharts &&
                              <Line
                                display={'block'}
                                data={this.updateDataSet(calcType)}
                                options={graphOptions[calcType.id]}
                              />
                            }
                            {
                              roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id] === undefined &&
                              <div className="alert bg-light border-info text-center" style={{margin: '0px 20%'}}>
                                No data
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    )
                  }}
                )}
              </div>

              {/* Odd Index */}
              <div style={{display: 'flex', flexDirection: 'column', position: 'absolute', left: '50%', width: '50%', height: '100%'}}>
                {selectedCategory.calcTypes.map((calcType, index) => {
                  if(index % 2 !== 0) {
                    return (
                      <div key={index} style={{flex: '1 1 auto', width: '100%', position: 'relative'}}>
                        <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'absolute'}}>
                          <div style={{flex: '1 1 auto'}}>
                            {roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id] !== undefined && shouldRenderCharts &&
                              <Line
                                display={'block'}
                                data={this.updateDataSet(calcType)}
                                options={graphOptions[calcType.id]}
                              />
                            }
                            {
                              roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id] === undefined &&
                              <div className="alert bg-light border-info text-center" style={{margin: '0px 20%'}}>
                                No data
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    )
                  }}
                )}
              </div>
            </div>
          : ''
        }
      </div>
    )
  }

  updateDataSet (calcType) {

    const { roicResults, dataSetProps, timeLabels } = this.props
    const { selectedEntityType, selectedNetworkType } = this.state

    return {
      labels:timeLabels,
      datasets: [
        {
          data: roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values,
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

  handleEntityTypeChange (e) {
    const selectedEntityType = this.props.entityTypes.find(item => item.id === e.target.value);
    this.setState({ selectedEntityType })
  }

  selectCategory (category) {
    this.setState({ selectedCategory: category, shouldRenderCharts: false })
    // Whats the deal with "shouldRenderCharts"? For cases where we have multiple charts in one tab, the
    // charts sometimes initialize before the HTML flexbox layouts are completed. This leads to charts
    // overlapping one another. We are using a timeout so that the browser will finish laying out the divs,
    // and then initialize charts correctly. This is hacky, if there is a better solution feel free to implement it.
    const RENDER_TIMEOUT_CHARTS = 50 // milliseconds
    setTimeout(function() { this.setState({ shouldRenderCharts: true }) }.bind(this), RENDER_TIMEOUT_CHARTS);
  }
}

const mapStateToProps = (state) => ({
  roicResults: state.analysisMode.roicResults,
  enumStrings: state.analysisMode.enumStrings,
  networkEquipment: state.mapLayers.networkEquipment,
  networkNodeTypesEntity: state.analysisMode.networkNodeTypesEntity
})

const mapDispatchToProps = (dispatch) => ({
})

const RoicReportsLargeComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsLarge)
export default RoicReportsLargeComponent