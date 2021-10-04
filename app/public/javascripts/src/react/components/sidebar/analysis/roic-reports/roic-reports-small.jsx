import React, { Component } from 'react'
import { connect } from 'react-redux'
import RoicReportsActions from './roic-reports-actions'
import { Line } from 'react-chartjs-2'
import RoicReportsSummary from './roic-reports-summary.jsx'

export class RoicReportsSmall extends Component {
  constructor (props) {
    super(props)

    this.props.loadNetworkNodeTypesEntity() // Moved from state.js to redux

    this.state = {
      selectedEntityType: this.props.entityTypes.filter(item => item.id === 'network')[0],
      selectedNetworkType: this.props.networkTypes.filter(item => item.id === 'planned_network')[0],
      selectedCategory: this.props.categories[1],
      selectedCalcType: this.props.categories[1].calcTypes[0]
    }
  }

  render () {

    const { roicResults, networkTypes, categories, entityTypes, graphOptions } = this.props
    const { selectedEntityType, selectedNetworkType, selectedCategory, selectedCalcType } = this.state

    return (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{flex: '0 0 auto'}}>
          <h3 className="mb-3 mt-3">Summary</h3>
        </div>
        <div style={{flex: '0 0 auto'}}>
          <RoicReportsSummary
            roicResults={roicResults}
          />
        </div>

        <div style={{flex: '0 0 auto'}}>
          <h3 className="pb-3 pt-3" style={{borderTop: '1px solid lightgray'}}>Financial Details</h3>
        </div>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Network Type</div>
              <div className="col-sm-8">
                <select className="form-control" value={selectedNetworkType.id}
                  onChange={(event) => this.handleNetworkTypeChange(event)}
                >
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Group</div>
              <div className="col-sm-8">
                <select className="form-control" value={selectedCategory.id}
                  onChange={(event) => this.handleCategoriesChange(event)}
                >
                  { categories.filter((categorie) => categorie.id !== 'summary')
                    .map((item, index) =>
                      <option key={index} value={item.id} label={item.description}></option>
                    )
                  }
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Metric</div>
              <div className="col-sm-8">
                <select className="form-control" value={selectedCalcType.id}
                  onChange={(event) => this.handleCalcTypeChange(event)}
                >
                  {selectedCategory.calcTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group row">
              <div className="col-sm-4 roic-report-label">Entity Type</div>
              <div className="col-sm-8">
                <select className="form-control" value={selectedEntityType.id}
                  onChange={(event) => this.handleEntityTypeChange(event)}
                >
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
          {/* roicResults.roicAnalysis.components does not has values,
          so condition is implemented to avoid error while rendering */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' +
              selectedCalcType.id] !== undefined &&
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
          {/* roicResults.roicAnalysis.components does not has values,
          so condition is implemented to avoid error while rendering */}
          {Object.keys(roicResults.roicAnalysis.components).length > 0
            ? roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' +
              selectedCalcType.id] === undefined && this.chartDataWarning()
            : this.chartDataWarning()
          }
        </div>
      </div>
    )
  }

  chartDataWarning () {
    return (
      <div className="alert alert-warning" role="alert">
        No data available for the selected combination of Network Type, Entity Type and Calculation Type.
      </div>
    )
  }

  updateDataSet () {

    const { roicResults, dataSetProps, timeLabels } = this.props
    const { selectedEntityType, selectedNetworkType, selectedCalcType } = this.state


    return {
      labels: timeLabels,
      datasets: [
        {
          data: roicResults.roicAnalysis.components[selectedNetworkType.id.toUpperCase()][selectedEntityType.id + '.' + selectedCalcType.id].values,
          fill: dataSetProps.fill,
          pointBackgroundColor: dataSetProps.pointBackgroundColor,
          pointHoverBackgroundColor: dataSetProps.pointHoverBackgroundColor
        }
      ]
    }
  }

  handleNetworkTypeChange (event) {
    const selectedNetworkType = this.props.networkTypes.find(item => item.id === event.target.value)
    this.setState({ selectedNetworkType })
    this.props.loadROICResultsForPlan(this.props.planId)
  }

  handleCategoriesChange (event) {
    const selectedCategory = this.props.categories.find(item => item.id === event.target.value)
    this.setState({ selectedCategory, selectedCalcType: selectedCategory.calcTypes[0] })
  }

  handleCalcTypeChange (event) {
    const selectedCalcType = this.state.selectedCategory.calcTypes.find(item => item.id === event.target.value)
    this.setState({ selectedCalcType })
  }

  handleEntityTypeChange (event) {
    const selectedEntityType = this.props.entityTypes.find(item => item.id === event.target.value)
    this.setState({ selectedEntityType })
    this.props.loadROICResultsForPlan(this.props.planId)
  }
}

const mapStateToProps = (state) => ({
  roicResults: state.roicReports.roicResults,
})

const mapDispatchToProps = (dispatch) => ({
  loadNetworkNodeTypesEntity: () => dispatch(RoicReportsActions.loadNetworkNodeTypesEntity()),
  loadROICResultsForPlan: (planId) => dispatch(RoicReportsActions.loadROICResultsForPlan(planId)),
})

const RoicReportsSmallComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsSmall)
export default RoicReportsSmallComponent
