import boundaryDetail from './sidebar/view/boundary-detail';
import equipmentDetail from './sidebar/view/equipment-detail';
import locationDetail from './sidebar/view/location-detail';
import roadSegmentDetail from './sidebar/view/road-segment-detail'
import coverageBoundary from './sidebar/view/coverage-boundary'
import locationEditor from './sidebar/view/location-editor'

app.component('boundaryDetail',boundaryDetail)
   .component('equipmentDetail',equipmentDetail)
   .component('locationDetail',locationDetail)
   .component('roadSegmentDetail',roadSegmentDetail)
   .component('coverageBoundary',coverageBoundary)
   .component('locationEditor',locationEditor)
