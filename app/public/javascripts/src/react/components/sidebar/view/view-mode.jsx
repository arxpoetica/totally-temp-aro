import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Collapse, Card, CardHeader, CardBody } from 'reactstrap'
import { viewModePanels, targetSelectionModes, displayModes } from '../constants'
import { usePrevious } from '../../../common/view-utils.js'
import { dequal } from 'dequal'
import ToolBarActions from '../../header/tool-bar-actions'
import SelectionActions from '../../selection/selection-actions'
import AroSearch from './aro-search.jsx'
import LocationInfo from '../../location-info/location-info.jsx'
import EquipmentDetail from './equipment-info/equipment-detail.jsx'
import BoundaryDetail from './boundary-detail.jsx'
import RoadSegmentDetail from './road-segment-detail.jsx'
import NetworkPlanManage from './network-plan-manage.jsx'
import CoverageBoundary from './coverage-boundary.jsx'
import LocationEditor from './location-editor.jsx'
import ServiceLayerEditor from './service-layer-editor.jsx'

const ViewMode = (props) => {
  const {
    perspective,
    cloneSelection,
    setMapSelection,
    selectedLocations,
    showViewModePanels,
    activeViewModePanel,
    selectedDisplayMode,
    setActiveViewModePanel,
    selectedTargetSelectionMode,
  } = props

  // #179702878
  // make sure the new selectedLocations schema meshes with where it's being sent
  const prevSelectedLocations = usePrevious(selectedLocations)
  useEffect(() => {
    if (
      !dequal(prevSelectedLocations, selectedLocations)
      && !dequal(activeViewModePanel, viewModePanels.EDIT_LOCATIONS)
      && !dequal(activeViewModePanel, viewModePanels.EDIT_SERVICE_LAYER)
    ) {
      const firstLocationId = selectedLocations.values().next().value
      updateSelectedState(firstLocationId)
      if (firstLocationId) {
        setActiveViewModePanel(viewModePanels.LOCATION_INFO)
      }
    }
  }, [selectedLocations])

  const updateSelectedState = (locationId) => {
    if (!perspective) { return }

    if (checkSelectedDisplayMode(displayModes.VIEW) && checkIsShowViewModePanels(viewModePanels.LOCATION_INFO)) {
      const newSelection = cloneSelection()
      if (locationId) { newSelection.editable.location = { [locationId]: locationId } }
      setMapSelection(newSelection)
    }
  }

  const toggleViewModePanel = (cardEvent) => {
    const { event } = cardEvent.target.dataset
    setActiveViewModePanel(event)
  }

  const showCard = (viewModePanel) => {
    return `card-collapse ${activeViewModePanel === viewModePanel ? 'collapse-show' : ''}`
  }

  const showCardHeader = (viewModePanel) => {
    return `card-header-dark ${activeViewModePanel === viewModePanel ? 'card-fixed' : ''}`
  }

  const checkIsActivePanel = (viewModePanel) => {
    return activeViewModePanel === viewModePanel
  }

  const checkSelectedDisplayMode = (displayMode) => {
    return selectedDisplayMode === displayMode
  }

  const checkIsShowViewModePanels = (viewModePanel) => {
    return showViewModePanels && showViewModePanels[viewModePanel]
  }

  const checkTargetSelectionMode = (targetSelectionMode) => {
    return selectedTargetSelectionMode === targetSelectionMode
  }

  return (
    <div className="view-mode-container">

      {/* Location Info */}
      <Card className={showCard(viewModePanels.LOCATION_INFO)}>
        <CardHeader
          className={showCardHeader(viewModePanels.LOCATION_INFO)}
          data-event={viewModePanels.LOCATION_INFO}
          onClick={(event) => toggleViewModePanel(event)}
        >
          Location Info
        </CardHeader>
        <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.LOCATION_INFO)}>
          <CardBody className="card-body-space">
            {checkIsActivePanel(viewModePanels.LOCATION_INFO)
              && <AroSearch
                objectName='location'
                labelId='objectId'
                entityType='LocationObjectEntity'
                select='id,objectId'
                searchColumn='objectId'
              />
            }
            <LocationInfo />
          </CardBody>
        </Collapse>
      </Card>

      {/* Equipment Info */}
      {checkIsShowViewModePanels(viewModePanels.EQUIPMENT_INFO)
        && <Card className={showCard(viewModePanels.EQUIPMENT_INFO)}>
          <CardHeader
            className={showCardHeader(viewModePanels.EQUIPMENT_INFO)}
            data-event={viewModePanels.EQUIPMENT_INFO}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Equipment Info
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.EQUIPMENT_INFO)}>
            <CardBody className="card-body-space">
              <EquipmentDetail />
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Boundaries Info */}
      {checkIsShowViewModePanels(viewModePanels.BOUNDARIES_INFO)
        && <Card className={showCard(viewModePanels.BOUNDARIES_INFO)}>
          <CardHeader
            className={showCardHeader(viewModePanels.BOUNDARIES_INFO)}
            data-event={viewModePanels.BOUNDARIES_INFO}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Boundaries Info
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.BOUNDARIES_INFO)}>
            <CardBody className="card-body-space">
              <BoundaryDetail />
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Conduit Info */}
      {checkIsShowViewModePanels(viewModePanels.ROAD_SEGMENT_INFO)
        && <Card className={showCard(viewModePanels.ROAD_SEGMENT_INFO)}>
          <CardHeader
            className={showCardHeader(viewModePanels.ROAD_SEGMENT_INFO)}
            data-event={viewModePanels.ROAD_SEGMENT_INFO}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Conduit Info
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.ROAD_SEGMENT_INFO)}>
            <CardBody className="card-body-space">
              <RoadSegmentDetail />
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Plan Info */}
      {checkIsShowViewModePanels(viewModePanels.PLAN_INFO)
        && <Card className={showCard(viewModePanels.PLAN_INFO)}>
          <CardHeader
            className={showCardHeader(viewModePanels.PLAN_INFO)}
            data-event={viewModePanels.PLAN_INFO}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Plan Info
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.PLAN_INFO)}>
            <CardBody className="card-body-space">
              { checkIsActivePanel(viewModePanels.PLAN_INFO) && <NetworkPlanManage /> }
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Planner coverage is a little different. Show it only if we are in COVERAGE_BOUNDARY mode. */}
      {(checkIsShowViewModePanels(viewModePanels.COVERAGE_BOUNDARY)
        && checkTargetSelectionMode(targetSelectionModes.COVERAGE_BOUNDARY)
        && checkIsActivePanel(viewModePanels.COVERAGE_BOUNDARY))
        && <Card className={showCard(viewModePanels.COVERAGE_BOUNDARY)}>
          <CardHeader
            className={showCardHeader(viewModePanels.COVERAGE_BOUNDARY)}
            data-event={viewModePanels.COVERAGE_BOUNDARY}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Coverage Boundary
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.COVERAGE_BOUNDARY)}>
            <CardBody className="card-body-space">
              <CoverageBoundary mapGlobalObjectName="map"/>
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Edit Locations is a little different. Show it only if we are in EDIT_LOCATION mode. */}
      {(checkIsShowViewModePanels(viewModePanels.EDIT_LOCATIONS)
        && checkIsActivePanel(viewModePanels.EDIT_LOCATIONS))
        && <Card className={showCard(viewModePanels.EDIT_LOCATIONS)}>
          <CardHeader
            className={showCardHeader(viewModePanels.EDIT_LOCATIONS)}
            data-event={viewModePanels.EDIT_LOCATIONS}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Edit Locations
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.EDIT_LOCATIONS)}>
            <CardBody className="card-body-space">
              <LocationEditor />
            </CardBody>
          </Collapse>
        </Card>
      }

      {/* Edit Service Layer is a little different. Show it only if we are in EDIT_SERVICE_LAYER mode. */}
      {(checkSelectedDisplayMode(displayModes.VIEW)
        && checkIsActivePanel(viewModePanels.EDIT_SERVICE_LAYER))
        && <Card className={showCard(viewModePanels.EDIT_SERVICE_LAYER)}>
          <CardHeader
            className={showCardHeader(viewModePanels.EDIT_SERVICE_LAYER)}
            data-event={viewModePanels.EDIT_SERVICE_LAYER}
            onClick={(event) => toggleViewModePanel(event)}
          >
            Edit Service Layer
          </CardHeader>
          <Collapse className="collapse-height" isOpen={checkIsActivePanel(viewModePanels.EDIT_SERVICE_LAYER)}>
            <CardBody className="card-body-space">
              <ServiceLayerEditor />
            </CardBody>
          </Collapse>
        </Card>
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
  selectedLocations: state.selection.locations,
  activeViewModePanel: state.toolbar.rActiveViewModePanel,
  showViewModePanels: state.toolbar.appConfiguration.perspective
    && state.toolbar.appConfiguration.perspective.showViewModePanels,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  selectedTargetSelectionMode: state.toolbar.selectedTargetSelectionMode,
  perspective: state.toolbar.appConfiguration.perspective,
})

const mapDispatchToProps = (dispatch) => ({
  cloneSelection: () => dispatch(SelectionActions.cloneSelection()),
  setActiveViewModePanel: panel => dispatch(ToolBarActions.activeViewModePanel(panel)),
  setMapSelection: (mapSelection) => dispatch(SelectionActions.setMapSelection(mapSelection)),
})

export default connect(mapStateToProps, mapDispatchToProps)(ViewMode)
