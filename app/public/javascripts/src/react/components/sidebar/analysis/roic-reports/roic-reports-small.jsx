import React, { Component } from 'react'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import AnalysisActions from '../analysis-actions'

// https://flaviocopes.com/how-to-format-number-as-currency-javascript/
const currencyformatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 1
})

const numberformatter_1 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1
})

const numberformatter_0 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0
})

export class RoicReportsSmall extends Component {
  constructor (props) {
    super(props)

    this.props.loadNetworkNodeTypesEntity() // Moved from state.js to redux

    this.config = { 
      "length": {
        "length_units": "miles",
        "length_units_to_meters": "1609.34",
        "meters_to_length_units": "0.000621371"
      }
    }

    this.series = ['Series A', 'Series B']

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
    return this.props.roicResults === null ? null : this.renderRoicReportsSmall()
  }

  renderRoicReportsSmall () {

    const {roicResults, networkEquipment, networkNodeTypesEntity, networkTypes,
           categories, entityTypes, datasetOverride, graphOptions} = this.props
    const {FIBER_STRINGS, CABLE_CONSTRUCTION_STRINGS, selectedEntityType,
          selectedNetworkType, selectedCategory, selectedCalcType} = this.state

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
                  <React.Fragment key={index}>
                  {networkStatistic.networkStatisticType === 'roic_npv' &&
                    <tr>
                      {networkStatistic.networkStatisticType === 'roic_npv' &&
                        <td><strong>NPV</strong></td>
                      }
                      {networkStatistic.networkStatisticType === 'roic_npv' &&
                        currencyformatter.format(networkStatistic.value / 1000)+" K" 
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
                <td>{currencyformatter.format(roicResults.priceModel.totalCost / 1000)+" K"}</td>
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
                      <td>{currencyformatter.format(fiberCost.totalCost / 1000)+" K"}</td>
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
                      <td>{currencyformatter.format(equipmentCost.total / 1000)+" K"}</td>
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

        <div style={{flex: '0 0 auto'}}>
          <h3 className="pb-3 pt-3" style={{borderTop: '1px solid lightgray'}}>Financial Details</h3>
        </div>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Network Type</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e)=>this.handleNetworkTypeChange(e)} value={selectedNetworkType.id}>
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Group</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e)=>this.handleCategoriesChange(e)} value={selectedCategory.id}>
                {categories.filter((categorie) => categorie.id  !== 'summary')
                 .map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>  

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Metric</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e)=>this.handleCalcTypeChange(e)} value={selectedCalcType.id}>
                  {selectedCategory.calcTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Entity Type</div>
              <div className="col-sm-8">
                <select className="form-control" onChange={(e)=>this.handleEntityTypeChange(e)} value={selectedEntityType.id}>
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
            ? roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id].values &&
              <canvas id="line"
                  class="chart chart-line"
                  chart-data={roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id].values}
                  //chart-labels={timeLabels}
                  chart-series={this.series}
                  chart-options={graphOptions[selectedCalcType.id]}
                  chart-dataset-override={datasetOverride}>
              </canvas>
            : ''
          }
        </div>

        <div style={{flex: '1 1 auto'}}>
          {/* <!-- If we do not have chart data, display a warning --> */}
          {/* roicResults.roicAnalysis.components does not has values, so condition is implemented to avoid error while rendering */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? !(roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id].values) &&
                <div className="alert alert-warning" role="alert">
                  No data available for the selected combination of Network Type, Entity Type and Calculation Type.
                </div>
            : ''
          }
        </div>
      </div>
    )
  }

  handleNetworkTypeChange (e) {
    let selectedNetworkType = {}
    {this.props.networkTypes.map((item, index) => {
      if(item.id === e.target.value){
        selectedNetworkType = item
      }
    })}
    this.setState({selectedNetworkType: selectedNetworkType})
  }

  handleCategoriesChange (e) {
    let selectedCategory = {}
    {this.props.categories.map((item, index) => {
      if(item.id === e.target.value){
        selectedCategory = item
      }
    })}
    this.setState({selectedCategory: selectedCategory})
  }

  handleCalcTypeChange (e) {
    let selectedCalcType = {}
    console.log(this.state.selectedCategory)
    {this.state.selectedCategory.calcTypes.map((item, index) => {
      if(item.id === e.target.value){
        selectedCalcType = item
      }
    })}
    this.setState({selectedCalcType: selectedCalcType})
  }

  handleEntityTypeChange (e) {
    let selectedEntityType = {}
    {this.props.entityTypes.map((item, index) => {
      if(item.id === e.target.value){
        selectedEntityType = item
      }
    })}
    this.setState({selectedEntityType: selectedEntityType})
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

const RoicReportsSmallComponent = wrapComponentWithProvider(reduxStore, RoicReportsSmall, mapStateToProps, mapDispatchToProps)
export default RoicReportsSmallComponent