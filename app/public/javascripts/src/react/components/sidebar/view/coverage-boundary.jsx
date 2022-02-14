import React, { useState, useEffect, useRef } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import AroHttp from '../../../common/aro-http'
import ToolBarActions from '../../header/tool-bar-actions'
import StateViewModeActions from '../../state-view-mode/state-view-mode-actions'
import { targetSelectionModes, controlStates } from '../constants'
import '../sidebar.css'

export const CoverageBoundary = (props) => {

  const [state, setState] = useState({
    controlState: controlStates.NO_TARGET_SELECTED,
    coverageRadius: 10000, // In whatever units are specified in the configuration.units service
    householdsCovered: null,
  })

  const { mapGlobalObjectName, configuration, getOptimizationBody, selectedTargetSelectionMode } = props

  const { controlState, coverageRadius, householdsCovered } = state

  const targetMarker = new google.maps.Marker({
    position: new google.maps.LatLng(-122, 48),
    icon: {
      url: '/images/map_icons/aro/coverage_target.png',
      anchor: new google.maps.Point(16, 16) // Anchor should be at the center of the crosshair icon
    },
    draggable: true,
    map: null,
    optimized: !ARO_GLOBALS.MABL_TESTING,
  })

  targetMarker.addListener('dragend', (event) => handleCoverageTargetUpdated(event.latLng))

  let coveragePolygon = null

  let mapRef = window[mapGlobalObjectName]

  // Works as same as componentDidMount, componentWillUnmount
  // https://stackoverflow.com/questions/53945763/componentdidmount-equivalent-on-a-react-function-hooks-component
  useEffect(() => {
    // We should have a map variable at this point
    if (!mapRef) {
      console.error('ERROR: The Coverage Boundary component initialized, but a map object is not available at this time.')
      return
    }

    // Use the cross hair cursor while this control is initialized
    mapRef.setOptions({ draggableCursor: 'crosshair' })

    // Handler for map click
    const clickListener = google.maps.event.addListener(mapRef, 'click', function (event) {
      handleCoverageTargetUpdated(event.latLng)
    })

    // onDestroy
    return () => {
      // Remove the click event listener that we registered
      google.maps.event.removeListener(clickListener)

      // Remove the coverage polygon that we had created
      if (coveragePolygon) coveragePolygon.setMap(null)

      // Remove the marker we created
      targetMarker.setMap(null)

      // Go back to the default map cursor
      mapRef.setOptions({ draggableCursor: null })

      // Set mapRef to null, in case any async code is running that will draw polygons on the map
      mapRef = null

      // Target selection mode cannot be COVERAGE_BOUNDARY anymore
      selectedTargetSelectionMode(targetSelectionModes.SINGLE_PLAN_TARGET)
    }
  }, [])

  const handleCoverageTargetUpdated = (position) => {
    // If we are still processing a previous click, do nothing
    if (controlState === controlStates.COMPUTING) {
      console.warn('Warning: A coverage boundary computation is in process. Ignoring handleCoverageTargetUpdated')
      return
    }

    // Update the marker position and show it in the map
    targetMarker.position = position
    targetMarker.setMap(mapRef)
    targetMarker.setDraggable(false) // No dragging while we are computing coverage
    setState((state) => ({ ...state, controlState: controlStates.COMPUTING, householdsCovered: null }))
    if (coveragePolygon) coveragePolygon.setMap(null)

    calculateCoverage()
      .then((result) => {
        // Draw the polygon onto the screen
        coveragePolygon = new google.maps.Polygon({
          paths: result.coveragePolygon,
          strokeColor: '#FF1493',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF1493',
          fillOpacity: 0.4,
          clickable: false
        })
        coveragePolygon.setMap(mapRef)
        setState((state) => ({ ...state, householdsCovered: result.householdsCovered,
          controlState: controlStates.COMPUTED
        }))
        targetMarker.setDraggable(true) // Allow dragging the marker
      })
      .catch((err) => {
        console.error(err)
        targetMarker.setDraggable(true) // Allow dragging the marker
      })
  }

  // To get the updated state while using event-handler
  // https://stackoverflow.com/questions/55265255/react-usestate-hook-event-handler-using-initial-state
  const coverageRadiusRef = useRef(coverageRadius)
  const setCoverageRadius = (coverageRadius) => {
    coverageRadiusRef.current = coverageRadius
    setState((state) => ({ ...state, coverageRadius }))
  }

  const calculateCoverage = () => {
    // Get the POST body for optimization based on the current application state
    const optimizationBody = getOptimizationBody()
    // Replace analysis_type and add a point and radius
    optimizationBody.analysis_type = 'COVERAGE'
    optimizationBody.point = {
      type: 'Point',
      coordinates: [targetMarker.position.lng(), targetMarker.position.lat()]
    }
    // Always send radius in meters to the back end
    optimizationBody.radius = parseInt(coverageRadiusRef.current) * configuration.units.length_units_to_meters

    return AroHttp.post('/service/v1/network-analysis/boundary', optimizationBody)
      .then((result) => {
        // Format the result so we can use it to create a polygon
        const polygonPath = []
        result.data.polygon.coordinates[0].forEach((polygonVertex) => {
          polygonPath.push({
            lat: polygonVertex[1],
            lng: polygonVertex[0]
          })
        })
        return Promise.resolve({
          householdsCovered: result.data.coverageInfo.length,
          coveragePolygon: polygonPath
        })
      })
      .catch((err) => console.error(err))
  }

  const onChangeCoverageRadious = (event) => {
    const { value: coverageRadius } = event.target
    setCoverageRadius(coverageRadius)
    setState((state) => ({ ...state, coverageRadius }))
  }

  return (
    <div className="coverage-boundary-container">
      {/* Spinner that will be shown while the coverage area is being loaded from the server */}
      {
        controlState === controlStates.COMPUTING &&
        <div style={{ margin: '30px', textAlign: 'center' }}>
          <p>Calculating coverage area...</p>
          <div className="spinner aro-coverageBoundarySpinner">
            <div className="rect1" />
            <div className="rect2" />
            <div className="rect3" />
            <div className="rect4" />
            <div className="rect5" />
          </div>
        </div>
      }
      {/* A div that overlays over the control. Show when the user hasn't selected anything on the map */}
      {
        controlState === controlStates.NO_TARGET_SELECTED &&
        <div className="alert alert-info" role="alert">
          Click on the map to calculate a coverage boundary
        </div>
      }
      <table className="table table-striped table-sm aro-tblCoverageBoundaryOptions">
        <tbody>
          <tr>
            <td>Coverage Radius</td>
            <td>
              <input
                className="form-control"
                value={coverageRadius}
                onChange={(event) => onChangeCoverageRadious(event)}
              />
            </td>
            <td>{configuration.units.length_units}</td>
          </tr>
          <tr>
            <td>Households covered</td>
            <td>{householdsCovered || 'N/A'}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const mapStateToProps = (state) => ({
  configuration: state.toolbar.appConfiguration,
})

const mapDispatchToProps = (dispatch) => ({
  selectedTargetSelectionMode: (value) => dispatch(ToolBarActions.selectedTargetSelectionMode(value)),
  getOptimizationBody: () => dispatch(StateViewModeActions.getOptimizationBody()),
})

export default wrapComponentWithProvider(reduxStore, CoverageBoundary, mapStateToProps, mapDispatchToProps)
