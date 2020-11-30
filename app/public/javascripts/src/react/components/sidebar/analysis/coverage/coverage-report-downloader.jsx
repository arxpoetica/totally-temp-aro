import React, { Component } from 'react'
import { connect } from 'react-redux'
import AroHttp from '../../../../common/aro-http'
import { saveAs } from 'file-saver'

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
      selectedReportType: this.reportTypes.filter(item => item.mediaType === 'xls')[0],
      numReportsSelected: 0,
      reportFilename: '',
      reportDownloading: false
    }

    this.loadReportDetails()
  }

  render () {

    const {reports, reportTypes, selectedReportType, numReportsSelected,
           reportFilename, reportDownloading} = this.state

    return (
      <div className="container pt-3">

        {/* Checkboxes to determine which report(s) to download */}
        <div className="row">
          <ul style={{padding: '0px', listStyleType: 'none'}}>
            {reports.map((report, index) =>
              <li className="pt-1 pb-1" key={report.id}>
                <input type="checkbox" style={{marginRight: '5px'}} className="checkboxfill"
                  value={report.selectedForDownload}
                  onChange={(e)=>this.updateDownloadFilenameAndMediaType(e, report.id)}
                />
                {report.displayName}
              </li>
            )}
          </ul>
        </div>

        {/* The media type of the report to download (CSV, Excel) */}
        <div className="row">
          <div className="col-md-3">Report type:</div>
          <div className="col-md-9" disabled={numReportsSelected === 0}>
            <select className="form-control" value={selectedReportType.description}
              onChange={(e)=>this.reportTypeChange(e)} disabled={numReportsSelected === 0}>
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
              <input type="text" className="form-control" value={reportFilename}
                aria-describedby="btnDownloadClubbedExcel" disabled={numReportsSelected === 0}/>
              <div className="input-group-append">
                <button className="btn btn-primary btn-block" type="button" id="btnDownloadClubbedExcel"
                  disabled={numReportsSelected === 0 || reportDownloading} onClick={(e)=>this.downloadReport(e)}>
                  <span className="fa fa-download"></span>
                  {reportDownloading &&
                    <span className="fa fa-spinner fa-spin"></span>
                  }
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
        this.updateDownloadFilenameAndMediaType()
        this.setState({reports: reports})
      })
      .catch(err => console.error(err))
  }

  reportTypeChange(e) {
    let selectedReportType = this.reportTypes.find(item => item.description === e.target.value);
    this.setState({selectedReportType: selectedReportType})
  }

  updateDownloadFilenameAndMediaType (e, reportId) {

    let reports = this.state.reports
    reports.map((item, index) => item.id === reportId  ? item.selectedForDownload = !item.selectedForDownload : item.selectedForDownload)

    const now = new Date()
    const timeStamp = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`
  
    let numReportsSelected = reports.filter(item => item.selectedForDownload).length

    if (numReportsSelected === 0) {
      this.setState({reportFilename: '', numReportsSelected: numReportsSelected})
    } else if (numReportsSelected === 1) {
      const selectedReport = reports.filter(item => item.selectedForDownload)[0]
      let reportFilename = `${selectedReport.name}_${timeStamp}`
      let reportTypes = [
        { mediaType: 'xls', description: 'Excel' },
        { mediaType: 'csv', description: 'CSV' }
      ]
      let selectedReportType = reportTypes[0]
      this.setState({reportFilename: reportFilename, selectedReportType: selectedReportType, 
                     numReportsSelected: numReportsSelected, reportTypes: reportTypes})
    }  else if (numReportsSelected > 1) {
      // If multiple reports are selected, then we can only have an Excel download
      let reportFilename = `Consolidated_${timeStamp}`
      let reportTypes = [
        { mediaType: 'xls', description: 'Excel' }
      ]
      let selectedReportType = this.reportTypes[0]
      this.setState({reportFilename: reportFilename, selectedReportType: selectedReportType,
                     numReportsSelected: numReportsSelected, reportTypes: reportTypes})
    }
  }

  downloadReport () {
    this.setState({reportDownloading: true})

    const selectedReports = this.state.reports.filter(item => item.selectedForDownload)
    const fileName = `${this.state.reportFilename}.${this.state.selectedReportType.mediaType}`
    if (this.state.selectedReportType.mediaType !== 'xls') {
      // We are downloading an individual, non-excel report. We need { responseType: 'arraybuffer' } to receive binary data.
      AroHttp.get(`/service-download-file/${fileName}/v2/report-extended/${selectedReports[0].id}/${this.props.plan.id}.${this.state.selectedReportType.mediaType}`,
        { responseType: 'arraybuffer' })
        .then(result => {
          saveAs(new Blob([result]), fileName)
          this.setState({reportDownloading: false})
        })
        .catch(err => console.error(err))
    } else {
      // We are downloading excel reports. We need { responseType: 'arraybuffer' } to receive binary data.
      const reportNames = this.state.reports.filter(item => item.selectedForDownload)
        .map(item => item.id)

        AroHttp.post(`/service-download-file/${fileName}/v2/report-extended-queries/${this.props.plan.id}.xls`, reportNames,
        { responseType: 'arraybuffer' })
        .then(result => {
          saveAs(new Blob([result]), fileName)
          this.setState({reportDownloading: false})
        })
        .catch(err => console.error(err))
    }
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