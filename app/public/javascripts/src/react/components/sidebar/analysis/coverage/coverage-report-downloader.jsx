import React, { Component } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../../../common/aro-http'

export class coverageReportDownloader extends Component {
  constructor (props) {
    super(props)

    this.reportTypes = [
      { mediaType: 'xls', description: 'Excel' },
      { mediaType: 'csv', description: 'CSV' }
    ]

    this.state = {
      reports: [],
      reportTypes: this.reportTypes,
      selectedReportType: this.reportTypes.filter(item => item.mediaType === 'xls')[0]
    }

    this.loadReportDetails()
  }

  render () {

    const {reports, reportTypes, selectedReportType} = this.state

    console.log(selectedReportType)

    return (
      <div className="container pt-3">

        {/* Checkboxes to determine which report(s) to download */}
        <div className="row">
          <ul style={{padding: '0px', listStyleType: 'none'}}>
            {reports.map((report, index) =>
              <li className="pt-1 pb-1" key={report.id}>
                <input type="checkbox" style={{marginRight: '5px'}} className="checkboxfill"
                  value={report.selectedForDownload}
                  onChange={(e)=>this.updateDownloadFilenameAndMediaType(e)}
                />
                {report.displayName}
              </li>
            )}
          </ul>
        </div>

        {/* The media type of the report to download (CSV, Excel) */}
        <div className="row">
          <div className="col-md-3">Report type:</div>
          <div className="col-md-9">
            <select className="form-control" value={selectedReportType} onChange={(e)=>this.reportTypeChange(e)}>
              {reportTypes.map((item, index) =>
                <option key={index} value={item.description} label={item.description}></option>
              )}
            </select>
          </div>
        </div>

        {/* The filename of the report to download */}
        <div className="row">
          <div className="col-md-3">Filename:</div>
          <div className="col-md-9">
            <div className="input-group mb-3">
              <input type="text" className="form-control" aria-describedby="btnDownloadClubbedExcel"/>
              <div className="input-group-append">
                <button className="btn btn-primary btn-block" type="button" id="btnDownloadClubbedExcel">
                  <span className="fa fa-download"></span>
                  {/* <span className="fa fa-spinner fa-spin"></span> */}
                </button>
              </div>
            </div>
          </div>  
        </div>

      </div>
    )
  }

  loadReportDetails () {
    let reports = []
    if (!this.props.coverageReport) {
      return
    }

    // Get the coverage report details
    AroHttp.get('/service/v2/installed/report/meta-data')
      .then(result => {
        const allowedReportType = (this.props.coverageReport.coverageAnalysisRequest.coverageType === 'location') ? 'COVERAGE' : 'FORM477'
        reports = result.data.filter(item => item.reportType === allowedReportType)
        reports.forEach((item, index) => {
          reports[index].downloadUrlPrefix = `/report-extended/${item.id}/${this.props.plan.id}`
          reports[index].selectedForDownload = false
        })
        this.setState({reports: reports})
      })
      .catch(err => console.error(err))
  }

  reportTypeChange(e) {
    this.setState({selectedReportType: e.target.value})
  }

  updateDownloadFilenameAndMediaType (e) {
    console.log(e)
  }


}

const mapStateToProps = (state) => ({
  coverageReport: state.coverage.report,
  plan: state.plan.activePlan
})  

const mapDispatchToProps = (dispatch) => ({
})

const coverageReportDownloaderComponent = connect(mapStateToProps, mapDispatchToProps)(coverageReportDownloader)
export default coverageReportDownloaderComponent