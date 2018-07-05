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
      <div class="form-group" style="display:table;width:100%">
        <div class="col" style="display:table-cell;vertical-align:bottom">
          <label for="nameField">Boundary Search:</label>
        </div>  
        <div class="col" style="display:table-cell;vertical-align:middle">
          <select class="form-control"
            ng-model="$ctrl.state.selectedBoundaryTypeforSearch"
            ng-change="$ctrl.onChangeBoundaryTypeforSearch()"
            ng-options="item as item.name for item in $ctrl.state.boundaries.tileLayers | filter:{visible_check:true}">
            <option value="" selected="selected" hidden>Select a boundary type for search</option>
          </select>
        </div>
      </div>
      <aro-search ng-if="$ctrl.state.activeViewModePanel === $ctrl.state.viewModePanels.BOUNDARIES_INFO"
        object-name="Boundary Layer"
        label-id="code"
        search-list="$ctrl.state.entityTypeBoundaryList"
        selected="$ctrl.selectedBoundary"
        refresh-tag-list="$ctrl.state.loadBoundaryEntityList(searchObj)"
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
      <div>Code: {{$ctrl.selectedSAInfo.code}}</div>
      <div>Name: {{$ctrl.selectedSAInfo.name}}</div>
    </div>
    <div class="boundary-detail" ng-if="$ctrl.selectedAnalysisAreaInfo !== null">
      <div>Name: {{$ctrl.selectedAnalysisAreaInfo.code}}</div>
    </div>
    `,
    bindings: {},
    controller: BoundaryDetailController
  }

  export default boundaryDetail