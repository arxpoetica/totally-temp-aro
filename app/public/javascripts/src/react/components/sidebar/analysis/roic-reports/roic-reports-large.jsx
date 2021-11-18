import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Line } from 'react-chartjs-2'
import RoicReportsSummary from './roic-reports-summary.jsx'
import RoicReportsActions from './roic-reports-actions'

export class RoicReportsLarge extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedNetworkType: this.props.networkTypes.filter(item => item.id === 'planned_network')[0],
      selectedEntityType: this.props.entityTypes.filter(item => item.id === 'network')[0],
      selectedCategory: this.props.categories[0],
      shouldRenderCharts: false
    }
  }

  componentDidMount () {
    this.selectCategory(this.props.categories[0])
  }

  render () {

    const { roicResults, networkTypes, categories, entityTypes, graphOptions } = this.props
    const { selectedEntityType, selectedNetworkType, selectedCategory, shouldRenderCharts } = this.state
    let selectedNetworkTypeKey = selectedNetworkType.id.toUpperCase()
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{flex: '0 0 auto'}}>
          <form>
            <div className="form-group row">
              <div className="col-sm-2">Network Type</div>
              <div className="col-sm-4">
                <select className="form-control" onChange={(event) => this.handleNetworkTypeChange(event)}
                  value={selectedNetworkType.id}
                >
                  {networkTypes.map((item, index) =>
                    <option key={index} value={item.id} label={item.description}></option>
                  )}
                </select>
              </div>
              <div className="col-sm-2 roic-report-label">Entity Type</div>
              <div className="col-sm-4">
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

        <div style={{flex: '0 0 auto'}}>
          <ul className="nav nav-tabs">
            {categories.map((category, index) =>
              <li className="nav-item" key={index}>
                <a className={`nav-link ${selectedCategory.id === category.id ? 'active' : ''}`}
                  href="#" onClick={() => this.selectCategory(category)}>{category.description}</a>
              </li>
            )}
          </ul>
        </div>

        {/* In "Summary" mode do not display graphs */}
        {selectedCategory.id === 'summary' &&
          <div className="m-4" style={{flex: '1 1 auto', position: 'relative', overflowY: 'auto'}}>
            <div className="container">
              <RoicReportsSummary
                roicResults={roicResults}
              />
            </div>
          </div>
        }

        {/* Show the graphs section only if we are not in "Summary" mode */}
        {selectedCategory.id !== 'summary' &&
          <div style={{flex: '1 1 auto', position: 'relative'}}>
            {/* Even Index */}
            <div style={{display: 'flex', flexDirection: 'column', position: 'absolute', width: '50%', height: '100%'}}>
              {selectedCategory.calcTypes.map((calcType, index) => {
                if (index % 2 === 0) {
                  return (
                    <div key={index} style={{flex: '1 1 auto', width: '100%', position: 'relative'}}>
                      <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'absolute'}}>
                        <div style={{flex: '1 1 auto'}}>
                          {selectedNetworkTypeKey in roicResults.roicAnalysis.components
                            ? roicResults.roicAnalysis.components[selectedNetworkTypeKey]
                              [selectedEntityType.id + '.' + calcType.id] !== undefined && shouldRenderCharts &&
                              <Line
                                display={'block'}
                                data={this.updateDataSet(calcType)}
                                options={graphOptions[calcType.id]}
                              />
                            : ''
                          }
                          {selectedNetworkTypeKey in roicResults.roicAnalysis.components
                            ? roicResults.roicAnalysis.components[selectedNetworkTypeKey]
                              [selectedEntityType.id + '.' + calcType.id] === undefined && this.chartDataWarning()
                            : this.chartDataWarning()
                          }
                        </div>
                      </div>
                    </div>
                  )
                }}
              )}
            </div>

            {/* Odd Index */}
            <div style={{display: 'flex', flexDirection: 'column', position: 'absolute',
              left: '50%', width: '50%', height: '100%'}}
            >
              {selectedCategory.calcTypes.map((calcType, index) => {
                if (index % 2 !== 0) {
                  return (
                    <div key={index} style={{flex: '1 1 auto', width: '100%', position: 'relative'}}>
                      <div style={{display: 'flex', flexDirection: 'column', width: '100%',
                        height: '100%', position: 'absolute'}}
                      >
                        <div style={{flex: '1 1 auto'}}>
                          {selectedNetworkTypeKey in roicResults.roicAnalysis.components
                            ? roicResults.roicAnalysis.components[selectedNetworkTypeKey]
                              [selectedEntityType.id + '.' + calcType.id] !== undefined && shouldRenderCharts &&
                              <Line
                                display={'block'}
                                data={this.updateDataSet(calcType)}
                                options={graphOptions[calcType.id]}
                              />
                            : ''
                          }
                          {selectedNetworkTypeKey in roicResults.roicAnalysis.components
                            ? roicResults.roicAnalysis.components[selectedNetworkTypeKey]
                              [selectedEntityType.id + '.' + calcType.id] === undefined && this.chartDataWarning()
                            : this.chartDataWarning()
                          }
                        </div>
                      </div>
                    </div>
                  )
                }}
              )}
            </div>
          </div>
        }
      </div>
    )
  }

  chartDataWarning () {
    return (
      <div className="alert bg-light border-info text-center" style={{margin: '0px 20%'}}>
        No data
      </div>
    )
  }

  updateDataSet (calcType) {
    // ToDo: this should be redesigned, it's trying to DRY up code but ends up duplicating the surounding code
    const { roicResults, dataSetProps, timeLabels } = this.props
    const { selectedEntityType, selectedNetworkType } = this.state
    let selectedNetworkTypeKey = selectedNetworkType.id.toUpperCase()
    let data = {}
    if (selectedNetworkTypeKey in roicResults.roicAnalysis.components) {
      data = roicResults.roicAnalysis.components[selectedNetworkTypeKey][selectedEntityType.id + '.' + calcType.id].values
    }
    return {
      labels: timeLabels,
      datasets: [
        {
          data,
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

  handleEntityTypeChange (event) {
    const selectedEntityType = this.props.entityTypes.find(item => item.id === event.target.value)
    this.setState({ selectedEntityType })
    this.props.loadROICResultsForPlan(this.props.planId)
  }

  selectCategory (category) {
    this.setState({ selectedCategory: category, shouldRenderCharts: false })
    // Whats the deal with "shouldRenderCharts"? For cases where we have multiple charts in one tab, the
    // charts sometimes initialize before the HTML flexbox layouts are completed. This leads to charts
    // overlapping one another. We are using a timeout so that the browser will finish laying out the divs,
    // and then initialize charts correctly. This is hacky, if there is a better solution feel free to implement it.
    const RENDER_TIMEOUT_CHARTS = 50 // milliseconds
    setTimeout(function() { this.setState({ shouldRenderCharts: true }) }.bind(this), RENDER_TIMEOUT_CHARTS)
  }
}

const mapStateToProps = (state) => ({
  roicResults: state.roicReports.roicResults,
})

const mapDispatchToProps = (dispatch) => ({
  loadROICResultsForPlan: (planId) => dispatch(RoicReportsActions.loadROICResultsForPlan(planId)),
})

const RoicReportsLargeComponent = connect(mapStateToProps, mapDispatchToProps)(RoicReportsLarge)
export default RoicReportsLargeComponent
