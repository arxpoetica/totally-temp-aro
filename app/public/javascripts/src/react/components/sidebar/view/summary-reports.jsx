import React, { useState } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AroHttp from '../../../common/aro-http'
import { saveAs } from 'file-saver'
import '../sidebar.css'

export const SummaryReports = (props) => {

  const downloadsObj = {
    equipment: {
      id: 1,
      caption: 'Export Equipment',
      url: '/reports/planSummary/{PLAN_ID}',
      fileName: 'planSummary.csv',
      isDownloading: false,
    },
    location: {
      id: 2,
      caption: 'Export Locations',
      url: '/reports/planSummary/{PLAN_ID}/{SELECTED_BOUNDARY_NAME}',
      fileName: 'Plan locations - {PLAN_NAME}.csv',
      isDownloading: false,
    },
    kml: {
      id: 3,
      caption: 'Export Site Boundaries',
      url: '/reports/planSummary/kml/{PLAN_ID}/{SELECTED_BOUNDARY_NAME}',
      fileName: 'Site boundaries - {SELECTED_BOUNDARY_NAME} - {PLAN_NAME}.kml',
      isDownloading: false,
    },
  }

  const [state, setState] = useState({
    downloads: downloadsObj,
  })

  const { plan, selectedBoundaryType } = props

  const { downloads } = state

  const downloadReport = (reportType) => {
    // Substitute plan id, selected boundary name, etc
    const { id: planId, name: planName } = plan
    const { name: selectedBoundaryName } = selectedBoundaryType

    downloads[reportType].url = downloads[reportType].url
      .replace('{PLAN_ID}', planId)
      .replace('{SELECTED_BOUNDARY_NAME}', selectedBoundaryName)
    downloads[reportType].fileName = downloads[reportType].fileName
      .replace('{PLAN_ID}', planId)
      .replace('{SELECTED_BOUNDARY_NAME}', selectedBoundaryName)
      .replace('{PLAN_NAME}', planName)
    downloads[reportType].isDownloading = true

    setState((state) => ({ ...state, downloads }))

    AroHttp.get(downloads[reportType].url, { responseType: 'arraybuffer' })
      .then((response) => {
        downloads[reportType].isDownloading = false
        setState((state) => ({ ...state, downloads }))
        saveAs(new Blob([response]), downloads[reportType].fileName)
      })
      .catch((err) => {
        console.error(err)
        downloads[reportType].isDownloading = false
        setState((state) => ({ ...state, downloads }))
      })
  }

  return (
    <div className="btn-group-vertical btn-block" style={{ marginTop: '10px' }}>
      {/* One button to download each type of report */}
      {
        Object.entries(downloads).map(([downloadKey, download]) => {
          return (
            <button
              type="button"
              key={download.id}
              className="pull-left btn btn-primary aro-summary-button-export"
              disabled={download.isDownloading}
              onClick={() => downloadReport(downloadKey)}
            >
              <span>{download.caption}</span>
              {
                download.isDownloading &&
                <span className="fa fa-spinner fa-spin" />
              }
            </button>
          )
        })
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  plan: state.plan.activePlan,
  selectedBoundaryType: state.mapLayers.selectedBoundaryType,
})

export default wrapComponentWithProvider(reduxStore, SummaryReports, mapStateToProps, null)
