import React, { useState, useEffect } from 'react'
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
import { displayModes } from '../sidebar/constants'
import AnalysisMode from '../sidebar/analysis/analysis-mode.jsx'
import RingEditor from '../sidebar/ring-editor.jsx'
import PlanEditorContainer from '../plan-editor/plan-editor-container.jsx'
import AroDebug from '../sidebar/debug/aro-debug.jsx'
import PlanSettings from '../plan/plan-settings.jsx'
import UINotifications from '../notification/ui-notifications.jsx'
import './map-split.css'

const transitionTimeMsec = 100
const transitionCSS = `width ${transitionTimeMsec}ms` // This must be the same for the map and sidebar, otherwise animations don't work correctly
let splitterObj = null

export const MapSplit = (props) => {
  const [isCollapsed, setCollapsed] = useState(false)
  const [sizesBeforeCollapse, setSizesBeforeCollapse] = useState(null)
  const [hovering, setHovering] = useState(false)

  const {
    planType,
    ARO_CLIENT,
    disableMap,
    showToolBox,
    isReportMode,
    setSidebarWidth,
    areTilesRendering,
    selectedDisplayMode,
  } = props

  useEffect(() => {
    if (!splitterObj) {
      splitterObj = Split(['#map-canvas-container', '#sidebar'], {
        sizes: [window.GLOBAL_MAP_SPLITTER_INITIAL_WIDTH || 75, window.GLOBAL_SIDEBAR_INITIAL_WIDTH || 25],
        minSize: [680, 310],
        onDragEnd: () => {
          // Trigger a resize so that any tiles that have been uncovered will be loaded
          if (map) { google.maps.event.trigger(map, 'resize') }
          if (map.getStreetView().getVisible()) {
            google.maps.event.trigger(panorama, 'resize')
          }

          const getSidebarWidth = splitterObj.getSizes()[1]
          setSidebarWidth(getSidebarWidth)
    
          if (splitterObj.getSizes()[1] > 0) {
            const event = new CustomEvent('toolBarResized')
            window.dispatchEvent(event)
            setCollapsed(false)
            setSizesBeforeCollapse(null)
          }
        }
      })
    }
  },[])

  const checkSelectedDisplayMode = (displayMode) => {
    return selectedDisplayMode === displayMode
  }

  const toggleCollapseSideBar = () => {
    if (isCollapsed) {
      // The sidebar is already collapsed. Un-collapse it by restoring the saved sizes
      splitterObj.setSizes(sizesBeforeCollapse)
      setSizesBeforeCollapse(null)

      // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar expand
      //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
      var event = new CustomEvent('toolBarResized');
      setTimeout(() => window.dispatchEvent(event), transitionTimeMsec + 50)
    } else {
      // Save the current sizes and then collapse the sidebar
      setSizesBeforeCollapse(splitterObj.getSizes())
      splitterObj.setSizes([99.5, 0.5])

      // To Trigger refreshToolbar() in tool-bar.jsx by creating the custom event when sidebar collapse
      //https://stackoverflow.com/questions/52037958/change-value-in-react-js-on-window-resize
      var event = new CustomEvent('toolBarResized');
      setTimeout(() => window.dispatchEvent(event), transitionTimeMsec + 50)
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
    <>
      {/* First define the container for both the map and the sidebar. */}
      <div className={`app_wrapper_container ${ARO_CLIENT === 'frontier' ? 'footer' : ''}`}>

        {/* Define the canvas that will hold the map. */}
        <div id="map-canvas-container" style={{ position: 'relative', float: 'left', height: '100%', transition: transitionCSS }}>
          <div id="map-canvas" className={`map-canvas ${!isReportMode ? 'map-canvas-drop-shadow' : '' }`} style={{ position: 'relative', overflow: 'hidden' }} />
          {/* Technically the toolbar, etc should be a child of the map canvas, but putting these elements in the map canvas
            causes the map to not show up */}

          <div id="header-bar-container" style={{ position: 'absolute', top: '0px', width: '100%', height: '55px', display: 'flex', flexDirection: 'row' }}>
            <div style={{flex: '0 0 70px' }} />
            {/* Created a 'reactCompClass' to get the ToolBar component elements in tool-bar.jsx */}
            <div className="reactCompClass" style={{ flex: '1 1 auto', position: 'relative' }}>
              <ToolBar />
            </div>
            <div style={{ flex: '0 0 auto', margin: 'auto' }}>
              <NetworkPlan />
            </div>
            <div id="spacerForIconOnSidebar" style={{flex: '0 0 40px' }} />
            {showToolBox
              && <ToolBox />
            }
          </div>
          {/* Plan target map selector should be active only if we are in analysis mode */}
          {/* Map Selector Plan Target */}
          {/* Map Selector Export Locations */}
          <ToastContainer />
          {/* A div that overlays on the map to denote disabled state. When shown, it will prevent any keyboard/mouse interactions with the map.
            Useful when you have made a slow-ish request to service and want to prevent further map interactions till you get a response. */}
          {disableMap
            && <div style={{ backgroundColor: 'white', opacity: '0.5', position: 'absolute', left: '0px', top: '0px', right: '0px', bottom: '0px' }}>
            <div className="d-flex" style={{ height: '100%', textAlign: 'center', alignItems: 'center' }}>
              <i className="fa fa-5x fa-spinner fa-spin" style={{ width: '100%' }} />
            </div>
          </div>
          }
          <EquipmentDropTarget />
          <ContextMenu />
        </div>

        {/* Define the sidebar */}
        {!isReportMode
          && <div id="sidebar" style={{ float: 'left', backgroundColor: '#fff', height: '100%', padding: '10px 0px', transition: transitionCSS }}>
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
            {!isCollapsed
              && <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '10px' }}>
                <div style={{ overflow: 'auto', flex: '0 0 auto' }}>
                  {/* this is necessary to make the display-mode-buttons flow correctly */}
                  <DisplayModeButtons />
                </div>
                <div style={{ flex: '1 1 auto', position: 'relative' }}>
                  {/* ng-if is important here because the plan settings components implement $onDestroy() to show a messagebox
                    when destroyed to ask if settings should be saved  */}
                  {checkSelectedDisplayMode(displayModes.VIEW) && <ViewMode /> }
                  {checkSelectedDisplayMode(displayModes.ANALYSIS) && planType != 'RING' && <AnalysisMode /> }
                  {checkSelectedDisplayMode(displayModes.EDIT_RINGS) && <RingEditor /> }
                  {checkSelectedDisplayMode(displayModes.EDIT_PLAN) && <PlanEditorContainer /> }
                  {checkSelectedDisplayMode(displayModes.DEBUG) && <AroDebug /> }
                  {checkSelectedDisplayMode(displayModes.PLAN_SETTINGS) && <PlanSettings /> }
                </div>
              </div>
            }
          </div>
        }
      </div>
      <div className="ui-note" style={{ pointerEvents: 'none', position: 'absolute', left: '0px', bottom: '25px' }} >
        {/* There used to be a "spinner" icon here, which has been removed. On profiling, we found that the
            spinning animation caused the tile rendering to be two times slower (e.g. 200ms with spinner vs 100 ms without)
            Do NOT add any kind of animated element in this control unless you suppress it when tiles are rendering */}
        <div className="ui-note-notes-contain">
          {areTilesRendering && <div className="ui-note-noteline">Rendering Tiles</div> }
          <UINotifications />
        </div>
      </div>
      {/* Footer */}
    </>
  )
}

const mapStateToProps = (state) => ({
  showToolBox: state.tool.showToolBox,
  ARO_CLIENT: state.configuration.system.ARO_CLIENT,
  isReportMode: state.mapReports.isReportMode,
  disableMap: state.planEditor.isCalculatingSubnets ||
    state.planEditor.isCreatingObject ||
    state.planEditor.isModifyingObject ||
    state.planEditor.isCommittingTransaction ||
    state.planEditor.isEnteringTransaction,
  selectedDisplayMode: state.toolbar.rSelectedDisplayMode,
  planType: state.plan && state.plan.activePlan && state.plan.activePlan.planType,
  areTilesRendering: state.map.areTilesRendering,
})

const mapDispatchToProps = (dispatch) => ({
  setSidebarWidth: sidebarWidth => dispatch(ToolBarActions.setSidebarWidth(sidebarWidth)),
})

export default wrapComponentWithProvider(reduxStore, MapSplit, mapStateToProps, mapDispatchToProps)
