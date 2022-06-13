/* global app */
import { react2angular } from 'react2angular'
import { ToastContainer } from 'react-toastify'

import MapSplit from '../react/components/map/map-split.jsx'
import ViewMode from '../react/components/sidebar/view/view-mode.jsx'
import DisplayModeButtons from '../react/components/sidebar/display-mode-buttons.jsx'
import NetworkPlan from '../react/components/sidebar/network-plan.jsx'
import MapViewToggle from '../react/components/map/map-view-toggle.jsx'
import MapSelectorPlanTarget from '../react/components/map/map-selector-plan-target.jsx'
import MapSelectorExportLocations from '../react/components/map/map-selector-export-locations.jsx'
import FrontierFooter from '../react/components/footer/frontier-footer.jsx'
import ServiceLayerEditor from '../react/components/sidebar/view/service-layer-editor.jsx'
import LocationEditor from '../react/components/sidebar/view/location-editor.jsx'
import EquipmentDetail from '../react/components/sidebar/view/equipment-info/equipment-detail.jsx'
import NetworkPlanManage from '../react/components/sidebar/view/network-plan-manage.jsx'
import PlanInfo from '../react/components/sidebar/view/plan-info.jsx'
import PlanSearch from '../react/components/header/plan-search.jsx'
import UserGroupsModal from '../react/components/global-settings/user-groups-modal.jsx'
import NotifyBroadcastModal from '../react/components/global-settings/notify-broadcast-modal.jsx'
import CoverageBoundary from '../react/components/sidebar/view/coverage-boundary.jsx'
import RoadSegmentDetail from '../react/components/sidebar/view/road-segment-detail.jsx'
import BoundaryDetail from '../react/components/sidebar/view/boundary-detail.jsx'
import AroSearch from '../react/components/sidebar/view/aro-search.jsx'
import RingEditor from '../react/components/sidebar/ring-editor.jsx'
import AnalysisMode from '../react/components/sidebar/analysis/analysis-mode.jsx'
import AroDebug from '../react/components/sidebar/debug/aro-debug.jsx'
import ToolBar from '../react/components/header/tool-bar.jsx'
import PlanSettings from '../react/components/plan/plan-settings.jsx'
import GlobalSettings from '../react/components/global-settings/global-settings.jsx'
import ResourceEditor from '../react/components/resource-editor/resource-editor.jsx'
import DataUpload from '../react/components/data-upload/data-upload.jsx'
import ManageUsers from '../react/components/user/manage-users.jsx'
import UserSettings from '../react/components/user/user-settings.jsx'
import MyAccount from '../react/components/user/my-account.jsx'
import TagManager from '../react/components/global-settings/tag-manager.jsx'
import ManageGroups from '../react/components/global-settings/manage-groups.jsx'
import MultiFactor from '../react/components/global-settings/multi-factor.jsx'
import ReleaseNotes from '../react/components/global-settings/release-notes.jsx'
import Broadcast from '../react/components/global-settings/broadcast.jsx'
import ConfigurationEditor from '../react/components/configuration/ui/configuration-editor.jsx'
import ContextMenu from '../react/components/context-menu/context-menu.jsx'
import CoverageInitializer from '../react/components/coverage/coverage-initializer.jsx'
import CoverageButton from '../react/components/coverage/coverage-button.jsx'
import RfpButton from '../react/components/optimization/rfp/rfp-button.jsx'
import NetworkAnalysisConstraints from '../react/components/optimization/network-analysis/network-analysis-constraints.jsx'
import NetworkAnalysisConnectivityDefinition from '../react/components/optimization/network-analysis/network-analysis-connectivity-definition.jsx'
import NetworkAnalysisOutput from '../react/components/optimization/network-analysis/network-analysis-output.jsx'
import NetworkOptimizationInput from '../react/components/optimization/network-optimization/network-optimization-input.jsx'
import NetworkOptimizationButton from '../react/components/optimization/network-optimization/network-optimization-button.jsx'
import PlanTargetList from '../react/components/selection/plan-target-list.jsx'
import PlanEditor from '../react/components/plan-editor/plan-editor.jsx'
import EquipmentDropTarget from '../react/components/plan-editor/equipment-drop-target.jsx'
import ReportModuleList from '../react/components/configuration/report/report-module-list.jsx'
import ReportsDownloadModal from '../react/components/optimization/reports/reports-download-modal.jsx'
import RfpAnalyzer from '../react/components/optimization/rfp/rfp-analyzer.jsx'
import RfpStatus from '../react/components/optimization/rfp/status/rfp-status.jsx'
import RingEdit from '../react/components/ring-edit/ring-edit.jsx'
import RingButton from '../react/components/ring-edit/ring-button.jsx'
import DuctEdit from '../react/components/data-edit/duct-edit.jsx'
import MapReportsListMapObjects from '../react/components/map-reports/map-reports-list-map-objects.jsx'
import LocationInfo from '../react/components/location-info/location-info.jsx'
import ResourcePermissions from '../react/components/acl/resource-permissions/resource-permissions.jsx'
import ProjectPermissions from '../react/components/project-template/project-permissions.jsx'
import EtlTemplates from '../react/components/etl-templates/etl-templates.jsx'
import PermissionsTable from '../react/components/acl/resource-permissions/permissions-table.jsx'
import SearchableSelect from '../react/components/common/searchable-select.jsx'
import PlanningConstraintsEditor from '../react/components/resource-manager/planning-constraints-editor.jsx'
import FusionEditor from '../react/components/resource-manager/fusion-editor.jsx'
import NetworkArchitectureEditor from '../react/components/resource-manager/network-architecture-editor.jsx'
import ToolBox from '../react/components/tool/tool-box.jsx'
import UINotifications from '../react/components/notification/ui-notifications.jsx'

import boundaries from './views/boundaries'
import locations from './views/locations'
import networkEquipment from './views/network-equipment'
import copper from './views/copper'
import cables from './views/cables'
import conduits from './views/conduits'
import fullScreenContainer from './full-screen/full-screen-container'
import aroPanel from './common/aro-panel'
import contextMenu from './common/context-menu/context-menu'
import tile from './tiles/tile'

import utils from './common/utilities'

import state from '../models/state'
import rxState from '../react/common/rxState'

import tileDataService from '../components/tiles/tile-data-service'

import reduxConfig from '../redux-config'

app.component('boundaries', boundaries)
  .component('locations', locations)
  .component('networkEquipment', networkEquipment)
  .component('cables', cables)
  .component('copper', copper)
  .component('conduits', conduits)
  .component('fullScreenContainer', fullScreenContainer)
  .component('aroPanel', aroPanel)
  .component('contextMenu', contextMenu)
  .component('tile', tile)

// ReactJS components
  .component('rMapSplit', react2angular(MapSplit))
  .component('rViewMode', react2angular(ViewMode))
  .component('rDisplayModeButtons', react2angular(DisplayModeButtons))
  .component('rNetworkPlan', react2angular(NetworkPlan))
  .component('rMapViewToggle', react2angular(MapViewToggle))
  .component('rMapSelectorPlanTarget', react2angular(MapSelectorPlanTarget))
  .component('rMapSelectorExportLocations', react2angular(MapSelectorExportLocations))
  .component('rFrontierFooter', react2angular(FrontierFooter))
  .component('rServiceLayerEditor', react2angular(ServiceLayerEditor))
  .component('rLocationEditor', react2angular(LocationEditor))
  .component('rEquipmentDetail', react2angular(EquipmentDetail))
  .component('rNetworkPlanManage', react2angular(NetworkPlanManage))
  .component('rPlanInfo', react2angular(PlanInfo))
  .component('rPlanSearch', react2angular(PlanSearch))
  .component('userGroupsModal', react2angular(UserGroupsModal))
  .component('notifyBroadcastModal', react2angular(NotifyBroadcastModal))
  .component('rCoverageBoundary', react2angular(CoverageBoundary, ['mapGlobalObjectName']))  
  .component('rRoadSegmentDetail', react2angular(RoadSegmentDetail))
  .component('rBoundaryDetail', react2angular(BoundaryDetail))
  .component('rAroSearch', react2angular(AroSearch, ['objectName', 'labelId', 'entityType', 'select', 'searchColumn', 'configuration']))
  .component('rRingEditor', react2angular(RingEditor))
  .component('rAnalysisMode', react2angular(AnalysisMode))
  .component('rAroDebug', react2angular(AroDebug))
  .component('rToolBar', react2angular(ToolBar))
  .component('rPlanSettings', react2angular(PlanSettings))
  .component('rGlobalSettings', react2angular(GlobalSettings))
  .component('rResourceEditor', react2angular(ResourceEditor))
  .component('rDataUpload', react2angular(DataUpload))
  .component('rManageUsers', react2angular(ManageUsers))
  .component('rTagManager', react2angular(TagManager))
  .component('rUserSettings', react2angular(UserSettings))
  .component('rMyAccount', react2angular(MyAccount))
  .component('rManageGroups', react2angular(ManageGroups))
  .component('rMultiFactor', react2angular(MultiFactor))
  .component('rReleaseNotes', react2angular(ReleaseNotes))
  .component('rBroadcast', react2angular(Broadcast))
  .component('rContextMenu', react2angular(ContextMenu))
  .component('rConfigurationEditor', react2angular(ConfigurationEditor))
  .component('rCoverageInitializer', react2angular(CoverageInitializer))
  .component('rCoverageButton', react2angular(CoverageButton))
  .component('rRfpButton', react2angular(RfpButton))
  .component('rNetworkAnalysisConnectivityDefinition', react2angular(NetworkAnalysisConnectivityDefinition))
  .component('rNetworkAnalysisConstraints', react2angular(NetworkAnalysisConstraints, ['initialValues', 'enableReinitialize']))
  .component('rNetworkAnalysisOutput', react2angular(NetworkAnalysisOutput))
  .component('rNetworkOptimizationInput', react2angular(NetworkOptimizationInput, ['onModify', 'networkAnalysisTypeId']))
  .component('rNetworkOptimizationButton', react2angular(NetworkOptimizationButton, ['onModify']))
  .component('rPlanTargetList', react2angular(PlanTargetList))
  .component('rPlanEditor', react2angular(PlanEditor))
  .component('rEquipmentDropTarget', react2angular(EquipmentDropTarget))
  .component('rReportModuleList', react2angular(ReportModuleList))
  .component('rReportsDownloadModal', react2angular(ReportsDownloadModal, ['reportTypes', 'title'])) // Some properties are passed in manually, not through redux.
  .component('rRfpAnalyzer', react2angular(RfpAnalyzer))
  .component('rRfpStatus', react2angular(RfpStatus))
  .component('rRingEdit', react2angular(RingEdit))
  .component('rRingButton', react2angular(RingButton, ['onModify']))
  .component('rDuctEdit', react2angular(DuctEdit, ['displayOnly']))
  .component('rMapReportsListMapObjects', react2angular(MapReportsListMapObjects))
  .component('rToastContainer', react2angular(ToastContainer))
  .component('rLocationInfo', react2angular(LocationInfo))
  .component('rResourcePermissions', react2angular(ResourcePermissions))
  .component('rPermissionsTable', react2angular(PermissionsTable))
  .component('rProjectPermissions', react2angular(ProjectPermissions))
  .component('rEtlTemplates', react2angular(EtlTemplates))
  .component('rSearchableSelect', react2angular(SearchableSelect))
  .component('rPlanningConstraintsEditor', react2angular(PlanningConstraintsEditor, ['onDiscard']))
  .component('rFusionEditor', react2angular(FusionEditor, ['onDiscard']))
  .component('rNetworkArchitectureEditor', react2angular(NetworkArchitectureEditor, ['onDiscard']))
  .component('rToolBox', react2angular(ToolBox))
  .component('rUiNotifications', react2angular(UINotifications))
  .service('Utils', utils)
  .service('state', state)
  .service('rxState', rxState)
  .service('tileDataService', tileDataService)
  .config(reduxConfig)