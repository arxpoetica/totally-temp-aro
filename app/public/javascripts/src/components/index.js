import boundaryDetail from './sidebar/view/boundary-detail';
import equipmentDetail from './sidebar/view/equipment-detail';
import locationDetail from './sidebar/view/location-detail';
import roadSegmentDetail from './sidebar/view/road-segment-detail'
import coverageBoundary from './sidebar/view/coverage-boundary'
import locationEditor from './sidebar/view/location-editor'
import viewMode from './sidebar/view/view-mode'
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
import conicTileSystemUploader from './sidebar/plan-settings/plan-data-selection/conic-tile-system-uploader'
import globalDataSourceUploadModal from './sidebar/plan-settings/plan-data-selection/data-source-upload-modal'
import planDataSelection from './sidebar/plan-settings/plan-data-selection/plan-data-selection'

app.component('boundaryDetail',boundaryDetail)
   .component('equipmentDetail',equipmentDetail)
   .component('locationDetail',locationDetail)
   .component('roadSegmentDetail',roadSegmentDetail)
   .component('coverageBoundary',coverageBoundary)
   .component('locationEditor',locationEditor)
   .component('viewMode',viewMode)
   .component('displayModeButtons',displayModeButtons)
   .component('optimizeButton',optimizeButton)
   .component('analysisExpertMode',analysisExpertMode)
   .component('analysisMode',analysisMode)
   .component('showTargets',showTargets)
   .component('networkAnalysis',networkAnalysis)
   .component('networkAnalysisOutput',networkAnalysisOutput)
   .component('networkAnalysisOutputContent',networkAnalysisOutputContent)
   .component('networkBuild',networkBuild)
   .component('networkBuildOutput',networkBuildOutput)
   .component('aroDebug',aroDebug)
   .component('viewSettings',viewSettings)
   .component('conicTileSystemUploader',conicTileSystemUploader)
   .component('globalDataSourceUploadModal',globalDataSourceUploadModal)
   .component('planDataSelection',planDataSelection)
