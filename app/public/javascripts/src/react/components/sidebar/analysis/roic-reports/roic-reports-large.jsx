import React, { Component } from 'react'
import { connect } from 'react-redux'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const numberformatter_1 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1
})

const numberformatter_0 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0
})

export class RoicReportsLarge extends Component {
  constructor (props) {
    super(props)

    this.config = config // Ugh - A global from a time long ago!

    this.state = {
      selectedNetworkType: this.props.networkTypes.filter(item => item.id === 'planned_network')[0],
      selectedEntityType: this.props.entityTypes.filter(item => item.id === 'network')[0],
      selectedCategory: {},
      shouldRenderCharts: false
    }
  }

  componentDidMount () {
    this.selectCategory(this.props.categories[0])
  }

  render () {

    const {networkTypes, entityTypes, categories, roicResults} = this.props
    const {selectedNetworkType, selectedEntityType, selectedCategory, shouldRenderCharts} = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-2">Network Type</div>
              <div className="col-sm-4">
                <select className="form-control" onChange={(e)=>this.handleNetworkTypeChange(e)} value={selectedNetworkType.id}>
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
              <div className="col-sm-2 roic-report-label">Entity Type</div>
              <div className="col-sm-4">
                <select className="form-control" onChange={(e)=>this.handleEntityTypeChange(e)} value={selectedEntityType.id}>
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
                    href="#" onClick={(e)=>this.selectCategory(category)}>{category.description}</a>
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
                      <React.Fragment key={index}>
                      {networkStatistic.networkStatisticType === 'roic_npv' &&
                        <tr>
                          {networkStatistic.networkStatisticType === 'roic_npv' &&
                            <td><strong>NPV</strong></td>
                          }
                          {networkStatistic.networkStatisticType === 'roic_npv' &&
                            this.config.currency_symbol+numberformatter_1.format(networkStatistic.value / 1000)+" K" 
                          }
                        </tr>
                      }
                    </React.Fragment>
                    )}
                  )}

                  {roicResults.networkStatistics.map((networkStatistic, index) => { 
                    return (
                      <React.Fragment key={index}>
                      {networkStatistic.networkStatisticType === 'roic_irr' &&
                        <tr>
                          {networkStatistic.networkStatisticType === 'roic_irr' &&
                            <td><strong>IRR</strong></td>
                          }
                          {networkStatistic.networkStatisticType === 'roic_irr' &&
                            numberformatter_1.format(networkStatistic.value * 100)+" %" 
                          }
                        </tr>
                      }
                      </React.Fragment>
                    )}
                  )}              

                  <tr>
                    <td><strong>Total Capex</strong></td>
                    <td>{this.config.currency_symbol+numberformatter_1.format(roicResults.priceModel.totalCost / 1000)+" K"}</td>
                  </tr>

                  <tr>
                    <td colSpan="2"><strong>Fiber Capex</strong></td>
                  </tr>
                  {roicResults.priceModel.fiberCosts.map((fiberCost, index) => { 
                    return (
                      <React.Fragment key={index}>
                        <tr>
                          <td className="indent-1 text-capitalize">
                            {FIBER_STRINGS[fiberCost.fiberType]} - 
                            {CABLE_CONSTRUCTION_STRINGS[fiberCost.constructionType]}
                            ({numberformatter_0.format(fiberCost.lengthMeters * this.config.length.meters_to_length_units)}
                            {this.config.length.length_units})
                          </td>
                          <td>{this.config.currency_symbol+numberformatter_1.format(fiberCost.totalCost / 1000)+" K"}</td>
                        </tr>
                      </React.Fragment>
                    )}
                  )}  

                  <tr>
                    <td colSpan="2"><strong>Equipment Capex</strong></td>
                  </tr>
                  {roicResults.priceModel.equipmentCosts.map((equipmentCost, index) => { 
                    return (
                      <React.Fragment key={index}>
                        <tr>
                          <td className="indent-1 text-capitalize">
                            {networkEquipment.equipments[equipmentCost.nodeType].label || networkNodeTypesEntity[equipmentCost.nodeType]} (x{numberformatter_0.format(equipmentCost.quantity)})
                          </td>
                          <td>{this.config.currency_symbol+numberformatter_1.format(equipmentCost.total / 1000)+" K"}</td>
                        </tr>
                      </React.Fragment>
                    )}
                  )}

                  {/* plannedNetworkDemand does not assigned or received from any where of the app, so condition is implemented to avoid error while rendering */}
                  {this.props.plannedNetworkDemand !== undefined
                    ? Object.entries(this.props.plannedNetworkDemand.locationDemand.entityDemands).map(([ key, value ], index)  => { 
                        return (
                          <React.Fragment key={index}>
                            <tr>
                              {key === 'small' || key === 'medium' || key === 'large' &&
                                <td className="indent-1 text-capitalize"> {key} Business </td>
                              }
                              {key === 'household' || key === 'celltower' &&
                                <td className="indent-1 text-capitalize"> {key} </td>
                              }
                              <td> {numberformatter_0.format(value.rawCoverage)}</td>
                            </tr> 
                          </React.Fragment>
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
          {/* roicResults.roicAnalysis.components does not has values, so condition is implemented to avoid error while rendering (need to be removed)*/}
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
                          {roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values && shouldRenderCharts &&
                            <canvas 
                              class="chart chart-line"
                              style={{width: '100%', height: '90%'}}
                              chart-data={roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values}
                              //chart-labels={timeLabels}
                              chart-series={this.series}
                              chart-options={graphOptions[calcType.id]}
                              chart-dataset-override={datasetOverride}>
                            </canvas>
                          }
                          {
                            !(roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values) &&
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
                          {roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values && shouldRenderCharts &&
                            <canvas 
                              class="chart chart-line"
                              style={{width: '100%', height: '90%'}}
                              chart-data={roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values}
                              //chart-labels={timeLabels}
                              chart-series={this.series}
                              chart-options={graphOptions[calcType.id]}
                              chart-dataset-override={datasetOverride}>
                            </canvas>
                          }
                          {
                            !(roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + calcType.id].values) &&
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

  handleNetworkTypeChange (e) {
    let selectedNetworkType = this.props.networkTypes.find(item => item.id === e.target.value);
    this.setState({selectedNetworkType: selectedNetworkType})
  }

  handleEntityTypeChange (e) {
    let selectedEntityType = this.props.entityTypes.find(item => item.id === e.target.value);
    this.setState({selectedEntityType: selectedEntityType})
  }

  selectCategory (category) {
    this.setState({selectedCategory: category, shouldRenderCharts: false})
    // Whats the deal with "shouldRenderCharts"? For cases where we have multiple charts in one tab, the
    // charts sometimes initialize before the HTML flexbox layouts are completed. This leads to charts
    // overlapping one another. We are using a timeout so that the browser will finish laying out the divs,
    // and then initialize charts correctly. This is hacky, if there is a better solution feel free to implement it.
    const RENDER_TIMEOUT_CHARTS = 50 // milliseconds
    setTimeout(function() { this.setState({shouldRenderCharts: true}) }.bind(this), RENDER_TIMEOUT_CHARTS);
  }
}

const mapStateToProps = (state) => ({
  roicResults: state.analysisMode.roicResults,
})  

const mapDispatchToProps = (dispatch) => ({
})

const RoicReportsLargeComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsLarge)
export default RoicReportsLargeComponent