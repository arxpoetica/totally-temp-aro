import BoundaryDetailController from './boundaryDetailController';

let boundaryDetail = {
    template: `
    <style scoped>
      .boundary-detail {
        position: relative; /* This will require the parent to have position: relative or absolute */
      }
      .boundary-detail > div {
        margin-top: 10px;
      }
    </style>
    <div class="mb-5 mt-2">
      <aro-search ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.BOUNDARIES_INFO"
        object-name="Census Block"
        search-list="$ctrl.state.entityTypeList.CensusBlocksEntity"
        selected="$ctrl.selectedBoundary"
        refresh-tag-list="$ctrl.state.loadEntityList('CensusBlocksEntity',searchObj,'id,tabblockId','tabblockId')"
        on-selection-changed="$ctrl.viewSelectedBoundary(selectedObj)">
      </aro-search>
    </div>
    <div class="boundary-detail" ng-if="$ctrl.selectedBoundaryInfo !== null">
      <div>Census Block Code: {{$ctrl.selectedBoundaryInfo.tabblock_id}}</div>
      <div>Area(sq. miles): {{$ctrl.selectedBoundaryInfo.area_meters / (1609.34 * 1609.34) | number: 2}}</div>
      <div>Area(acres): {{$ctrl.selectedBoundaryInfo.area_meters / 4046.86 | number: 2}}</div>
      <div>Area(sq. meters): {{$ctrl.selectedBoundaryInfo.area_meters | number: 2}}</div>
      <div>Centroid Latitude: {{$ctrl.selectedBoundaryInfo.centroid.coordinates[1] | number:5}}</div>
      <div>Centroid Longitude: {{$ctrl.selectedBoundaryInfo.centroid.coordinates[0] | number:5}}</div>
      <div ng-repeat="tag in $ctrl.selectedBoundaryTags" ng-if="undefined != tag.tagInfo">
        {{tag.censusCatDescription}} : <div class="outlineLegendIcon" style="border-color: {{tag.tagInfo.colourHash}}; background-color: {{tag.tagInfo.colourHash}}33;"></div> {{tag.tagInfo.description}}
      </div>
    </div>
    <div class="boundary-detail" ng-if="$ctrl.selectedSAInfo !== null">
      <div>Area Code: {{$ctrl.selectedSAInfo.code}}</div>
    </div>
    `,
    bindings: {},
    controller: BoundaryDetailController
  }

  export default boundaryDetail