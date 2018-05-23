import boundaryDetail from './sidebar/view/boundary-detail'
import equipmentDetail from './sidebar/view/equipment-detail'
import locationDetail from './sidebar/view/location-detail'
import roadSegmentDetail from './sidebar/view/road-segment-detail'
import coverageBoundary from './sidebar/view/coverage-boundary'
import locationEditor from './sidebar/view/location-editor'
import viewMode from './sidebar/view/view-mode'
import equipmentDetailModal from './sidebar/view/equipment-detail-modal'
import planInfo from './sidebar/view/plan-info'
import planInfoRecent from './sidebar/view/plan-info-recent'
import editPlanTag from './sidebar/view/edit-plan-tag'
import aroSearch from './sidebar/view/aro-search'
import displayModeButtons from './sidebar/display-mode-buttons'
import optimizeButton from './sidebar/optimize-button'
import analysisExpertMode from './sidebar/analysis/analysis-expert-mode'
import analysisMode from './sidebar/analysis/analysis-mode'
import showTargets from './sidebar/analysis/show-targets'
import networkAnalysis from './sidebar/analysis/network-analysis/network-analysis'
import networkAnalysisModal from './sidebar/analysis/network-analysis/network-analysis-modal'
import networkAnalysisOutput from './sidebar/analysis/network-analysis/network-analysis-output'
import networkAnalysisOutputContent from './sidebar/analysis/network-analysis/network-analysis-output-content'
import networkBuild from './sidebar/analysis/network-build/network-build'
import networkBuildOutput from './sidebar/analysis/network-build/network-build-output'
import aroDebug from './sidebar/debug/aro-debug'
import viewSettings from './sidebar/debug/view-settings'
import draggableButton from './sidebar/plan-editor/draggable-button'
import planEditor from './sidebar/plan-editor/plan-editor'
import conicTileSystemUploader from './sidebar/plan-settings/plan-data-selection/conic-tile-system-uploader'
import globalDataSourceUploadModal from './sidebar/plan-settings/plan-data-selection/data-source-upload-modal'
import planDataSelection from './sidebar/plan-settings/plan-data-selection/plan-data-selection'
import planNetworkConfiguration from './sidebar/plan-settings/plan-network-configuration/plan-network-configuration'
import planProjectConfiguration from './sidebar/plan-settings/plan-project-configuration/plan-project-configuration'
import planSettings from './sidebar/plan-settings/plan-settings'
import arpuEditor from './sidebar/plan-settings/plan-resource-selection/arpu-editor'
import impedanceEditor from './sidebar/plan-settings/plan-resource-selection/impedance-editor'
import planResourceEditorModal from './sidebar/plan-settings/plan-resource-selection/plan-resource-editor-modal'
import planResourceSelection from './sidebar/plan-settings/plan-resource-selection/plan-resource-selection'
import pricebookEditor from './sidebar/plan-settings/plan-resource-selection/pricebook-editor'
import resourceManager from './sidebar/plan-settings/plan-resource-selection/resource-manager'
import roicEditor from './sidebar/plan-settings/plan-resource-selection/roic-editor'
import boundaries from './views/boundaries'
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
import userAccountSettings from './global-settings/user-account-settings'
import manageUsers from './global-settings/manage-users'
import manageGroups from './global-settings/manage-groups'
import globalSettings from './global-settings/global-settings'
import aroPanel from './common/aro-panel'
import aroMultiSelect from './common/aro-multiselect'
import mapObjectEditor from './common/map-object-editor'
import dropTarget from './common/drop-target'
import searchPlanFilter from './common/search-plan-filter'
import accordion from './accordion/accordion'
import accordionPanelContents from './accordion/accordion-panel-contents'
import accordionPanelTitle from './accordion/accordion-panel-title'
import tile from './tiles/tile'
import userSettings from './global-settings/user-settings'
import tagManager from './global-settings/tag-manager'
import createUpdateTag from './global-settings/create-update-tag'

import aroObjectEditor from './common/editor-interfaces/aro-object-editor'
import editorInterfaceTree from './common/editor-interfaces/editor-interface-tree'
import editorInterfaceTable from './common/editor-interfaces/editor-interface-table'
import editorInterfaceValue from './common/editor-interfaces/editor-interface-value'
import utils from './common/utilities'


app.component('boundaryDetail', boundaryDetail)
   .component('equipmentDetail', equipmentDetail)
   .component('locationDetail', locationDetail)
   .component('roadSegmentDetail', roadSegmentDetail)
   .component('coverageBoundary', coverageBoundary)
   .component('locationEditor', locationEditor)
   .component('viewMode', viewMode)
   .component('equipmentDetailModal', equipmentDetailModal)
   .component('planInfo', planInfo)
   .component('planInfoRecent', planInfoRecent)
   .component('editPlanTag', editPlanTag)
   .component('aroSearch', aroSearch)
   .component('displayModeButtons', displayModeButtons)
   .component('optimizeButton', optimizeButton)
   .component('analysisExpertMode', analysisExpertMode)
   .component('analysisMode', analysisMode)
   .component('showTargets', showTargets)
   .component('networkAnalysis', networkAnalysis)
   .component('networkAnalysisOutput', networkAnalysisOutput)
   .component('networkAnalysisOutputContent', networkAnalysisOutputContent)
   .component('networkBuild', networkBuild)
   .component('networkBuildOutput', networkBuildOutput)
   .component('aroDebug', aroDebug)
   .component('viewSettings', viewSettings)
   .component('planEditor', planEditor)
   .component('draggableButton', draggableButton)
   .component('conicTileSystemUploader', conicTileSystemUploader)
   .component('globalDataSourceUploadModal', globalDataSourceUploadModal)
   .component('planDataSelection', planDataSelection)
   .component('planNetworkConfiguration', planNetworkConfiguration)
   .component('planProjectConfiguration', planProjectConfiguration)
   .component('planSettings', planSettings)
   .component('arpuEditor', arpuEditor)
   .component('impedanceEditor', impedanceEditor)
   .component('planResourceEditorModal', planResourceEditorModal)
   .component('planResourceSelection', planResourceSelection)
   .component('pricebookEditor', pricebookEditor)
   .component('resourceManager', resourceManager)
   .component('roicEditor', roicEditor)
   .component('boundaries', boundaries)
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
   .component('userAccountSettings', userAccountSettings)
   .component('manageUsers', manageUsers)
   .component('manageGroups', manageGroups)
   .component('globalSettings', globalSettings)
   .component('aroPanel', aroPanel)
   .component('aroMultiSelect', aroMultiSelect)
   .component('mapObjectEditor', mapObjectEditor)
   .component('dropTarget', dropTarget)
   .component('searchPlanFilter', searchPlanFilter)
   .component('accordion', accordion)
   .component('accordionPanelContents', accordionPanelContents)
   .component('accordionPanelTitle', accordionPanelTitle)
   .component('tile', tile)
   .component('userSettings', userSettings)
   .component('tagManager', tagManager)
   .component('createUpdateTag', createUpdateTag)
   .component('aroObjectEditor', aroObjectEditor)
   .component('editorInterfaceTree', editorInterfaceTree)
   .component('editorInterfaceTable', editorInterfaceTable)
   .component('editorInterfaceValue', editorInterfaceValue)
   .service('Utils', utils)
   
