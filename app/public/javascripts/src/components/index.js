import { react2angular } from 'react2angular'

import CoverageInitializer from '../react/components/coverage/coverage-initializer.jsx'
import CoverageButton from '../react/components/coverage/coverage-button.jsx'
import PlanTargetList from '../react/components/selection/plan-target-list.jsx'
import BroadcastButton from '../react/components/global-settings/broadcast-button.jsx'

import boundaryDetail from './sidebar/view/boundary-detail'
import equipmentDetail from './sidebar/view/equipment-detail'
import equipmentDetailList from './sidebar/view/equipment-detail-list'
import locationDetail from './sidebar/view/location-detail/location-detail'
import locationAuditLog from './sidebar/view/location-audit-log'
import locationDetailPropertiesFactory from '../components/sidebar/view/location-detail/location-detail-properties-factory'
import roadSegmentDetail from './sidebar/view/road-segment-detail'
import coverageBoundary from './sidebar/view/coverage-boundary'
import locationEditor from './sidebar/view/location-editor'
import viewMode from './sidebar/view/view-mode'
import planInfo from './sidebar/view/plan-info'
import planInfoRecent from './sidebar/view/plan-info-recent'
import editPlanTag from './sidebar/view/edit-plan-tag'
import aroSearch from './sidebar/view/aro-search'
import aroMultiselectSearch from './sidebar/view/aro-multiselect-search'
import displayModeButtons from './sidebar/display-mode-buttons'
import optimizeButton from './sidebar/optimize-button'
import summaryReports from './sidebar/summary-reports'
import analysisExpertMode from './sidebar/analysis/analysis-expert-mode'
import analysisMode from './sidebar/analysis/analysis-mode'

import locationRoicReports from './sidebar/analysis/roic-reports/location-roic-reports'
import networkBuildRoicReports from './sidebar/analysis/roic-reports/network-build-roic-reports'

import roicReports from './sidebar/analysis/roic-reports/roic-reports'
import roicReportsLarge from './sidebar/analysis/roic-reports/roic-reports-large'
import roicReportsSmall from './sidebar/analysis/roic-reports/roic-reports-small'
import roicReportsModal from './sidebar/analysis/roic-reports/roic-reports-modal'
import networkAnalysisBuild from './sidebar/analysis/network-analysis-build'
import networkAnalysisOutput from './sidebar/analysis/network-analysis/network-analysis-output'
import networkAnalysisOutputContent from './sidebar/analysis/network-analysis/network-analysis-output-content'
import networkAnalysisModal from './sidebar/analysis/network-analysis/network-analysis-modal'
import coverageReportDownloader from './sidebar/analysis/coverage/coverage-report-downloader'
import networkBuildOutput from './sidebar/analysis/network-build/network-build-output'
import aroDebug from './sidebar/debug/aro-debug'
import viewSettings from './sidebar/debug/view-settings'
import draggableButton from './sidebar/plan-editor/draggable-button'
import planEditor from './sidebar/plan-editor/plan-editor'
import planSummary from './sidebar/plan-editor/plan-summary'
import serviceLayerEditor from './sidebar/plan-editor/service-layer-editor'
import conicTileSystemUploader from './sidebar/plan-settings/plan-data-selection/conic-tile-system-uploader'
import globalDataSourceUploadModal from './sidebar/plan-settings/plan-data-selection/data-source-upload-modal'
import planDataSelection from './sidebar/plan-settings/plan-data-selection/plan-data-selection'
import planNetworkConfiguration from './sidebar/plan-settings/plan-network-configuration/plan-network-configuration'
import planProjectConfiguration from './sidebar/plan-settings/plan-project-configuration/plan-project-configuration'
import planSettings from './sidebar/plan-settings/plan-settings'
import arpuEditor from './sidebar/plan-settings/plan-resource-selection/arpu-editor'
import tsmEditor from './sidebar/plan-settings/plan-resource-selection/tsm-editor'
import competitorEditor from './sidebar/plan-settings/plan-resource-selection/competitor-editor'
import impedanceEditor from './sidebar/plan-settings/plan-resource-selection/impedance-editor'
import planResourceEditorModal from './sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal'
import planResourceSelection from './sidebar/plan-settings/plan-resource-selection/plan-resource-selection'
import pricebookEditor from './sidebar/plan-settings/plan-resource-selection/pricebook-editor'
import resourceManager from './sidebar/plan-settings/plan-resource-selection/resource-manager'
import pricebookCreator from './sidebar/plan-settings/plan-resource-selection/pricebook-creator'
import roicEditor from './sidebar/plan-settings/plan-resource-selection/roic-editor'
import rateReachEditor from './sidebar/plan-settings/plan-resource-selection/rate-reach-editor'
import rateReachManagerCreator from './sidebar/plan-settings/plan-resource-selection/rate-reach-manager-creator'
import rateReachDistanceEditor from './sidebar/plan-settings/plan-resource-selection/rate-reach-distance-editor'
import boundaries from './views/boundaries'
import locations from './views/locations'
import constructionSites from './views/construction-sites'
import networkEquipment from './views/network-equipment'
import mapSplit from './map/map-split'
import mapSelectorPlanTarget from './map/map-selector-plan-target'
import mapSelectorExportLocations from './map/map-selector-export-locations'
import mapToggleComponent from './map/map-toggle'
import toolBar from './header/tool-bar'
import reportModal from './header/report-modal'
import networkPlanModal from './header/network-plan-modal'
import planInputsModal from './header/plan-inputs-modal'
import networkPlanManage from './header/network-plan-manage'
import networkPlan from './header/network-plan'
import uiNotification from './footer/ui-notification'
import userAccountSettings from './global-settings/user-account-settings'
import manageUsers from './global-settings/manage-users'
import multifactorSettings from './global-settings/multifactor-settings'
import manageGroups from './global-settings/manage-groups'
import broadcast from './global-settings/broadcast'
import globalSettings from './global-settings/global-settings'
import aroPanel from './common/aro-panel'
import aroMultiSelect from './common/aro-multiselect'
import mapObjectEditor from './common/map-object-editor'
import contextMenu from './common/context-menu'
import boundaryCoverage from './common/boundary-coverage'
import dropTarget from './common/drop-target'
import planSearch from './common/plan/plan-search'
import planSearchFilter from './common/plan/plan-search-filter'
import resourcePermissionsEditor from './common/resource-permissions-editor'
import aroDrawingManager from './common/aro-drawing-manager'
import accordion from './accordion/accordion'
import accordionPanelContents from './accordion/accordion-panel-contents'
import accordionPanelTitle from './accordion/accordion-panel-title'
import tile from './tiles/tile'
import userSettings from './global-settings/user-settings'
import tagManager from './global-settings/tag-manager'
import releaseNotes from './global-settings/release-notes'
import createUpdateTag from './global-settings/create-update-tag'

import aroObjectEditor from './common/editor-interfaces/aro-object-editor'
import editorInterfaceTree from './common/editor-interfaces/editor-interface-tree'
import editorInterfaceTable from './common/editor-interfaces/editor-interface-table'
import editorInterfaceValue from './common/editor-interfaces/editor-interface-value'
import editorInterfacePrimitive from './common/editor-interfaces/editor-interface-primitive'
import editorInterfaceNullableNumber from './common/editor-interfaces/editor-interface-nullable-number'
import utils from './common/utilities'

import state from '../models/state'
import aclManager from '../models/aclManager'
import tileDataService from '../components/tiles/tile-data-service'

import reduxConfig from '../redux-config'

app.component('boundaryDetail', boundaryDetail)
  .component('equipmentDetail', equipmentDetail)
  .component('equipmentDetailList', equipmentDetailList)
  .component('locationDetail', locationDetail)
  .component('locationAuditLog', locationAuditLog)
  .component('roadSegmentDetail', roadSegmentDetail)
  .component('coverageBoundary', coverageBoundary)
  .component('locationEditor', locationEditor)
  .component('viewMode', viewMode)
  .component('planInfo', planInfo)
  .component('planInfoRecent', planInfoRecent)
  .component('editPlanTag', editPlanTag)
  .component('aroSearch', aroSearch)
  .component('aroMultiselectSearch', aroMultiselectSearch)
  .component('displayModeButtons', displayModeButtons)
  .component('optimizeButton', optimizeButton)
  .component('summaryReports', summaryReports)
  .component('analysisExpertMode', analysisExpertMode)
  .component('analysisMode', analysisMode)
  .component('networkAnalysisBuild', networkAnalysisBuild)
  .component('locationRoicReports', locationRoicReports)
  .component('networkBuildRoicReports', networkBuildRoicReports)
  .component('roicReports', roicReports)
  .component('roicReportsLarge', roicReportsLarge)
  .component('roicReportsSmall', roicReportsSmall)
  .component('roicReportsModal', roicReportsModal)
  .component('networkAnalysisOutput', networkAnalysisOutput)
  .component('networkAnalysisOutputContent', networkAnalysisOutputContent)
  .component('networkAnalysisModal', networkAnalysisModal)
  .component('coverageReportDownloader', coverageReportDownloader)
  .component('networkBuildOutput', networkBuildOutput)
  .component('aroDebug', aroDebug)
  .component('viewSettings', viewSettings)
  .component('planEditor', planEditor)
  .component('planSummary', planSummary)
  .component('serviceLayerEditor', serviceLayerEditor)
  .component('draggableButton', draggableButton)
  .component('conicTileSystemUploader', conicTileSystemUploader)
  .component('globalDataSourceUploadModal', globalDataSourceUploadModal)
  .component('planDataSelection', planDataSelection)
  .component('planNetworkConfiguration', planNetworkConfiguration)
  .component('planProjectConfiguration', planProjectConfiguration)
  .component('planSettings', planSettings)
  .component('arpuEditor', arpuEditor)
  .component('tsmEditor', tsmEditor)
  .component('competitorEditor', competitorEditor)
  .component('impedanceEditor', impedanceEditor)
  .component('planResourceEditorModal', planResourceEditorModal)
  .component('planResourceSelection', planResourceSelection)
  .component('pricebookEditor', pricebookEditor)
  .component('resourceManager', resourceManager)
  .component('pricebookCreator', pricebookCreator)
  .component('roicEditor', roicEditor)
  .component('rateReachEditor', rateReachEditor)
  .component('rateReachManagerCreator', rateReachManagerCreator)
  .component('rateReachDistanceEditor', rateReachDistanceEditor)
  .component('boundaries', boundaries)
  .component('locations', locations)
  .component('constructionSites', constructionSites)
  .component('networkEquipment', networkEquipment)
  .component('mapSplit', mapSplit)
  .component('mapSelectorPlanTarget', mapSelectorPlanTarget)
  .component('mapSelectorExportLocations', mapSelectorExportLocations)
  .component('mapToggleComponent', mapToggleComponent)
  .component('toolBar', toolBar)
  .component('reportModal', reportModal)
  .component('networkPlanModal', networkPlanModal)
  .component('planInputsModal', planInputsModal)
  .component('networkPlanManage', networkPlanManage)
  .component('networkPlan', networkPlan)
  .component('uiNotification', uiNotification)
  .component('userAccountSettings', userAccountSettings)
  .component('manageUsers', manageUsers)
  .component('multifactorSettings', multifactorSettings)
  .component('manageGroups', manageGroups)
  .component('broadcast', broadcast)
  .component('globalSettings', globalSettings)
  .component('aroPanel', aroPanel)
  .component('aroMultiSelect', aroMultiSelect)
  .component('mapObjectEditor', mapObjectEditor)
  .component('contextMenu', contextMenu)
  .component('boundaryCoverage', boundaryCoverage)
  .component('dropTarget', dropTarget)
  .component('planSearch', planSearch)
  .component('planSearchFilter', planSearchFilter)
  .component('resourcePermissionsEditor', resourcePermissionsEditor)
  .component('aroDrawingManager', aroDrawingManager)
  .component('accordion', accordion)
  .component('accordionPanelContents', accordionPanelContents)
  .component('accordionPanelTitle', accordionPanelTitle)
  .component('tile', tile)
  .component('userSettings', userSettings)
  .component('tagManager', tagManager)
  .component('releaseNotes', releaseNotes)
  .component('createUpdateTag', createUpdateTag)
  .component('aroObjectEditor', aroObjectEditor)
  .component('editorInterfaceTree', editorInterfaceTree)
  .component('editorInterfaceTable', editorInterfaceTable)
  .component('editorInterfaceValue', editorInterfaceValue)
  .component('editorInterfacePrimitive', editorInterfacePrimitive)
  .component('editorInterfaceNullableNumber', editorInterfaceNullableNumber)
// ReactJS components
  .component('rCoverageInitializer', react2angular(CoverageInitializer))
  .component('rCoverageButton', react2angular(CoverageButton))
  .component('rPlanTargetList', react2angular(PlanTargetList))
  .component('rBroadcastButton', react2angular(BroadcastButton))
  .service('Utils', utils)
  .service('state', state)
  .service('aclManager', aclManager)
  .service('tileDataService', tileDataService)
  .service('locationDetailPropertiesFactory', locationDetailPropertiesFactory)
  .config(reduxConfig)
