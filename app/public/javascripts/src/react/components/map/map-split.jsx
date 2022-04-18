/**
 * BIG FAT TODO: some of the functionality in this file belongs in an `App.jsx`
 * top-level component. As a last part of the React migration, we should create
 * that top level component and let it handle global stuff like providers and
 * what-not (like any Mantine providers).
 */

import React, { useState, useEffect, useRef } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ToolBar from '../header/tool-bar.jsx'
import ToolBox from '../tool/tool-box.jsx'
import NetworkPlan from '../sidebar/network-plan.jsx'
import DisplayModeButtons from '../sidebar/display-mode-buttons.jsx'
import ToolBarActions from '../header/tool-bar-actions'
import { ToastContainer } from 'react-toastify'
import EquipmentDropTarget from '../plan-editor/equipment-drop-target.jsx'
import ContextMenu from '../context-menu/context-menu.jsx'
import ViewMode from '../sidebar/view/view-mode.jsx'
import { displayModes, targetSelectionModes } from '../sidebar/constants'
import AnalysisMode from '../sidebar/analysis/analysis-mode.jsx'
import RingEditor from '../sidebar/ring-editor.jsx'
import PlanEditor from '../plan-editor/plan-editor.jsx'
import AroDebug from '../sidebar/debug/aro-debug.jsx'
import PlanSettings from '../plan/plan-settings.jsx'
import UINotifications from '../notification/ui-notifications.jsx'
import MapViewToggle from './map-view-toggle.jsx'
import './map-split.css'
import FrontierFooter from '../footer/frontier-footer.jsx'
import MapSelectorExportLocations from '../map/map-selector-export-locations.jsx'
import MapSelectorPlanTarget from '../map/map-selector-plan-target.jsx'
import ErrorBoundary from '../common/ErrorBoundary.jsx'
import { NotificationsProvider } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals';

const transitionTimeMsec = 100
// This must be the same for the map and sidebar, otherwise animations don't work correctly.
const transitionCSS = `width ${transitionTimeMsec}ms`
const toolBarResizeEvent = new CustomEvent('toolBarResized')
let splitterObj = null

const MapSplit = (props) => {
  const [hovering, setHovering] = useState(false)
  const [isCollapsed, setCollapsed] = useState(false)
  const [sizesBeforeCollapse, setSizesBeforeCollapse] = useState(null)
  const mapViewToggle = useRef(null)

  const {
    map,
    planType,
    ARO_CLIENT,
    disableMap,
    showToolBox,
    isReportMode,
    isRulerEnabled,
    setSidebarWidth,
    areTilesRendering,
    selectedDisplayMode,
    selectedTargetSelectionMode,
  } = props

  useEffect(() => {
    if (!splitterObj && map) {
      splitterObj = Split(['#map-canvas-container', '#sidebar'], {
        sizes: [window.GLOBAL_MAP_SPLITTER_INITIAL_WIDTH || 75, window.GLOBAL_SIDEBAR_INITIAL_WIDTH || 25],
        minSize: [680, 310],
        onDragEnd: () => {
          // Trigger a resize so that any tiles that have been uncovered will be loaded
          if (map) { google.maps.event.trigger(map, 'resize') }
          if (map.getStreetView().getVisible()) {
            google.maps.event.trigger(panorama, 'resize')
          }

          const sidebarWidth = splitterObj.getSizes()[1]
          setSidebarWidth(sidebarWidth)

          if (sidebarWidth > 0) {
            window.dispatchEvent(toolBarResizeEvent)
            setCollapsed(false)
            setSizesBeforeCollapse(null)
          }
        }
      })
    }
    if (map) { map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(mapViewToggle.current) }
  }, [map])

  const checkSelectedDisplayMode = (displayMode) => {
    return selectedDisplayMode === displayMode
  }

  const toggleCollapseSideBar = () => {
    if (isCollapsed) {
      // The sidebar is already collapsed. Un-collapse it by restoring the saved sizes
      splitterObj.setSizes(sizesBeforeCollapse)
      setSizesBeforeCollapse(null)
      // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar expand
      // https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
      setTimeout(() => window.dispatchEvent(toolBarResizeEvent), transitionTimeMsec + 50)
    } else {
      // Save the current sizes and then collapse the sidebar
      setSizesBeforeCollapse(splitterObj.getSizes())
      splitterObj.setSizes([99.5, 0.5])
      setTimeout(() => window.dispatchEvent(toolBarResizeEvent), transitionTimeMsec + 50)
    }
    setCollapsed(!isCollapsed)
    // Trigger a resize so that any tiles that have been uncovered will be loaded
    if (map) {
      // Call the resize a litle bit after animations finish, so that the right width is loaded
      setTimeout(() => google.maps.event.trigger(map, 'resize'), transitionTimeMsec + 50)
    }
    if (map.getStreetView().getVisible()) {
      setTimeout(() => google.maps.event.trigger(panorama, 'resize'), transitionTimeMsec + 50)
    }
  }

  return (
    <NotificationsProvider position="top-center">
    <ModalsProvider>
      {/* First define the container for both the map and the sidebar. */}
      <div className={`app_wrapper_container ${ARO_CLIENT === 'frontier' ? 'footer' : ''}`}>

        {/* Define the canvas that will hold the map. */}
        <div id="map-canvas-container" className="map-split-container" style={{ transition: transitionCSS }}>
          <div id="map-canvas" className={`map-canvas map-split ${!isReportMode ? 'map-canvas-drop-shadow' : ''}`} />
          {/* Technically the toolbar, etc should be a child of the map canvas, but putting these elements in the map canvas
            causes the map to not show up */}

          <div className="header-bar-container">
            <div className="header-space" />
            {/* Created a 'toolbar-container' to get the ToolBar component elements in tool-bar.jsx */}
            <div className="toolbar-container">
              <ErrorBoundary>
                <ToolBar />
              </ErrorBoundary>
            </div>
            <div className="sidebar-icon-space" />
            { showToolBox && <ToolBox /> }
          </div>
          {/* Plan target map selector should be active only if we are in analysis mode */}
          {/* Map Selector Plan Target */}
          {
            checkSelectedDisplayMode(displayModes.ANALYSIS) && !isRulerEnabled &&
            <MapSelectorPlanTarget />
          }
          {/* Map Selector Export Locations */}
          { checkSelectedDisplayMode(displayModes.VIEW)
            && selectedTargetSelectionMode === targetSelectionModes.POLYGON_EXPORT_TARGET &&
            <MapSelectorExportLocations />
          }
          <ToastContainer />
          {/* A div that overlays on the map to denote disabled state. When shown, it will prevent any keyboard/mouse
              interactions with the map. Useful when you have made a slow-ish request to service and want to prevent
              further map interactions till you get a response. */}
          {disableMap &&
            <div className="map-spinner-container">
              <div className="d-flex map-spinner">
                <i className="fa fa-5x fa-spinner fa-spin spin-icon" />
              </div>
            </div>
          }
          <EquipmentDropTarget />
          <ContextMenu />
        </div>

        {/* Define the sidebar */}
        {!isReportMode &&
          <div id="sidebar" className="sidebar-container" style={{ transition: transitionCSS }}>
            {/* Define the "expander widget" that can be clicked to collapse/uncollapse the sidebar. Note that putting
            the expander in one div affects the flow of elements in the sidebar, so we create a 0px by 0px div, and
            use this div to position the contents of the expander. This makes sure we don't affect flow. */}
            <div className="expander-position">
              <div
                className="expander-content"
                onClick={() => toggleCollapseSideBar()}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                {/* Why so complicated? The use case is:
                  1. When expanded, it should show an arrow pointing right
                  2. When collapsed and not hovering, it should show the display mode that is currently active
                  3. When collapsed and hovering, it should show an arrow pointing left */}
                <i
                  className={`fa fa-2x 
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.VIEW)) ? 'fa-eye' : ''}
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.ANALYSIS)) ? 'fa-gavel' : ''}
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.EDIT_RINGS)) ? 'fa-project-diagram' : ''}
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.EDIT_PLAN)) ? 'fa-pencil-alt' : ''}
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.DEBUG)) ? 'fa-bug' : ''}
                    ${(!hovering && isCollapsed && checkSelectedDisplayMode(displayModes.PLAN_SETTINGS)) ? 'fa-cog' : ''}
                    ${!isCollapsed ? 'fa-arrow-circle-right' : ''}
                    ${(hovering && isCollapsed) ? 'fa-arrow-circle-left' : ''}
                  `}
                />
              </div>
            </div>
            {/* Add a wrapping div because the expander changes the layout even though it is outside the panel */}
            {!isCollapsed &&
              <>
                <div className="display-mode-container">
                  <div className="display-mode-buttons">
                    {/* this is necessary to make the display-mode-buttons flow correctly */}
                    <DisplayModeButtons />
                  </div>
                  <NetworkPlan />
                  <div className="display-modes">
                    {/* Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, 
                      log those errors, and display a fallback UI instead of the component tree that crashed.
                      https://reactjs.org/docs/error-boundaries.html
                    */}
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.VIEW) && <ViewMode /> }
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.ANALYSIS) && planType !== 'RING' && <AnalysisMode /> }
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.EDIT_RINGS) && <RingEditor /> }
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.EDIT_PLAN) && <PlanEditor /> }
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.DEBUG) && <AroDebug /> }
                    </ErrorBoundary>
                    <ErrorBoundary>
                      {checkSelectedDisplayMode(displayModes.PLAN_SETTINGS) && <PlanSettings /> }
                    </ErrorBoundary>
                  </div>
                </div>
              </>
            }
          </div>
        }
      </div>
      <div className="ui-note ui-note-container">
        {/* There used to be a "spinner" icon here, which has been removed. On profiling, we found that the
            spinning animation caused the tile rendering to be two times slower (e.g. 200ms with spinner vs 100 ms without)
            Do NOT add any kind of animated element in this control unless you suppress it when tiles are rendering */}
        <div className="ui-note-notes-contain">
          {areTilesRendering && <div className="ui-note-noteline">Rendering Tiles</div> }
          <UINotifications />
        </div>
      </div>
      {/* Frontier Footer */}
      <FrontierFooter />
      {/* Remove the Visiblity and Push it into the googlemap */}
      {map &&
        <div style={{ visibility: 'hidden' }} ref={mapViewToggle}>
          <MapViewToggle />
        </div>
      }

      <style jsx>{`
        :global(.mantine-Modal-title) {
          font-size: 18px;
          font-weight: bold;
        }
      `}</style>
    </ModalsProvider>
    </NotificationsProvider>
  )
}

const mapStateToProps = (state) => ({
  showToolBox: state.tool.showToolBox,
  ARO_CLIENT: state.configuration.system.ARO_CLIENT,
  isReportMode: state.mapReports.isReportMode,
  disableMap: state.planEditor.isCalculatingSubnets
    || state.planEditor.isCreatingObject
    || state.planEditor.isModifyingObject
    || state.planEditor.isCommittingTransaction
    || state.planEditor.isEnteringTransaction,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  planType: state.plan && state.plan.activePlan && state.plan.activePlan.planType,
  areTilesRendering: state.map.areTilesRendering,
  map: state.map.googleMaps && state.map.googleMaps,
  selectedTargetSelectionMode: state.toolbar.selectedTargetSelectionMode,
  isRulerEnabled: state.toolbar.isRulerEnabled,
})

const mapDispatchToProps = (dispatch) => ({
  setSidebarWidth: sidebarWidth => dispatch(ToolBarActions.setSidebarWidth(sidebarWidth)),
})

export default wrapComponentWithProvider(reduxStore, MapSplit, mapStateToProps, mapDispatchToProps)
