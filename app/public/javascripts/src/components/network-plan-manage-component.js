app.directive('networkPlanManage', function () {
  return {
    restrict: 'E',
    transclude: true,
    replace: true,
    template: `
    <div>
      <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active">
        <a href="#create-new-plan" aria-controls="home" role="tab" data-toggle="tab">Create New Network Plan</a>
        </li>
        <li role="presentation">
        <a href="#open-saved-plan" aria-controls="home" role="tab" data-toggle="tab">Open Saved Network Plan</a>
        </li>
      </ul>

      <div class="tab-content" style="padding-top: 20px">
        <div role="tabpanel" class="tab-pane active" id="create-new-plan">
          <form action="/settings/update_settings" method="post">
            <fieldset>
              <div class="form-group">
                <label class="col-sm-4 control-label">Plan Name</label>
                <div class="col-sm-8">
                  <input id="txtNewPlanName" type="text" class="form-control" ng-focus="clear_default_text()" ng-model="new_plan_name"><br>
                </div>
              </div>
              <div class="form-group">
                <label class="col-sm-4 control-label">Choose Starting Location</label>
                <div class="col-sm-8">
                  <input id="txtNewPlanStartingLocation" class="form-control select2" style="width: 100%"></input><br>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div role="tabpanel" class="tab-pane" id="open-saved-plan" style="padding-top: 20px">

          <form>
          <div class="row">
            <div class="col-md-6">
              <div class="input-group">
              <input type="text" class="form-control" placeholder="Search for Plan Names, Owners, or Geographies" ng-model="search_text" ng-change="loadPlans()">
              <span class="input-group-addon">
                <span class="glyphicon glyphicon-search"></span>
              </span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="input-group">
              <span class="input-group-addon">{{ config.currency_symbol }}</span>
              <input type="text" class="form-control" placeholder="Minimum cost" ng-model="minimumCost" ng-change="loadPlans()">
              </div>
            </div>
            <div class="col-md-3">
              <div class="input-group">
              <span class="input-group-addon">{{ config.currency_symbol }}</span>
              <input type="text" class="form-control" placeholder="Maximum cost" ng-model="maximumCost" ng-change="loadPlans()">
              </div>
            </div>
          </div>

          <div ng-if="user.rol == admin" class="row">
            <div class="col-md-12">
            <div class="checkbox">
              <input type="checkbox" style="left: 10px; margin-top: 1px;" class="checkboxfill"
                  ng-model="allPlans"
                  name="ctype-name"
                  ng-change="$scope.loadPlans()"
              >
              <span style="padding-left: 13px">Show plans of all users</span>
            </div>
            </div>
          </div>
          <hr>          
        </form>

        <p ng-show="plans.length < 1" class="text-center">
          No plans found
        </p>
        <div ng-show="plans.length > 0">
          <div class="table-responsive">
          <table id="tblSelectPlans" class="table table-striped">
            <thead>
            <tr>
              <th>
                Name
                <a href="javascript:void(0)" ng-click="sortBy('name', true)">↓</a>
                <a href="javascript:void(0)" ng-click="sortBy('name', false)">↑</a>
              </th>
              <th>Status</th>
              <th>Actions</th>
              <th>
                Created at
                <a href="javascript:void(0)" ng-click="sortBy('created_at', true)">↓</a>
                <a href="javascript:void(0)" ng-click="sortBy('created_at', false)">↑</a>
              </th>
              <th>
                Updated at
                <a href="javascript:void(0)" ng-click="sortBy('updated_at', true)">↓</a>
                <a href="javascript:void(0)" ng-click="sortBy('updated_at', false)">↑</a>
              </th>
              <th>Owner</th>
              <th class="text-right">
                Total Cost
                <a href="javascript:void(0)" ng-click="sortBy('total_cost', true)">↓</a>
                <a href="javascript:void(0)" ng-click="sortBy('total_cost', false)">↑</a>
              </th>
              <th>Optimization Type</th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="plan in plans">
              <td><a href="javascript:void(0)" ng-click="selectPlan(plan)">{{plan.name}}</a></td>
              <td>
                <div ng-if="plan.progress">
                    <div style="float:left; width:200px">
                    <div class="progress" style="margin:0">
                        <div class="progress-bar progress-bar-striped active" role="progressbar" style="width: {{ plan.progress * 100 }}%">{{ plan.progressString }}</div>
                    </div>
                    </div>
                </div>
                <div ng-if="!plan.progress && plan.ranOptimization">
                    <div style="float:left; width:200px">
                    <div class="progress" style="margin:0">
                        <div class="progress-bar progress-bar-success" role="progressbar" style="width: 100%">Complete</div>
                    </div>
                    </div>
                </div>
              </td>
              <td>
                <a ng-if="plan.progress" class="btn btn-sm btn-success" ng-click="stopOptimization(plan)"><span class="fa fa-stop"></span></a>
                <a ng-if="!plan.progress" class="btn btn-sm btn-primary" ng-click="openReport(plan)"><span class="fa fa-folder"></span></a>
                <!--Commenting out "plan sharing" for now. Until we get ACL sorted out in aro-service-->
                <!--<a ng-if="!plan.progress" class="btn btn-sm btn-primary" ng-click="showSharePlan(plan)"><span class="glyphicon glyphicon-share"></span></a>-->
                <a ng-if="!plan.progress" class="btn btn-sm btn-danger" ng-click="deletePlan(plan)"><span class="glyphicon glyphicon-trash"></span></a>
              </td>
              <td>{{plan.updated_at | date:'shortDate'}}</td>
              <td>{{plan.created_at | date:'shortDate'}}</td>
              <td>{{plan.owner_first_name}} {{plan.owner_last_name}}</td>
              <td class="text-right">{{plan.total_cost | currency:"<%- config.currency_symbol %>"}}</td>
              <td></td>
            </tr>
            </tbody>
          </table>
          </div>
          <nav class="text-center">
            <ul class="pagination">
                <li ng-class="{ disabled: currentPage === 1 }">
                  <a href="javascript:void(0)" aria-label="Previous" ng-click="loadPlans(currentPage - 1)">
                    <span aria-hidden="true">&laquo;</span>
                  </a>
                </li>
                <li ng-repeat="page in pages" ng-class="{ active: page === currentPage }">
                  <a href="javascript:void(0)" ng-click="loadPlans(page)">{{ page }}</a>
                </li>
                <li ng-class="{ disabled: currentPage === pages[pages.length - 1] }">
                  <a href="javascript:void(0)" aria-label="Next" ng-click="loadPlans(pages[pages.length - 1])">
                    <span aria-hidden="true">&raquo;</span>
                  </a>
                </li>
            </ul>
          </nav>
        </div>
        
        </div>
      </div>
    </div>
    `,
    bindings: {},
    scope: { visible: '=' },
    controller: function ($scope, $http, $q, state, tracker) {
      this.state = state
      this.user = globalUser
      $scope.config = config

      this.tracker = tracker;
      $scope.allPlans = false
      $scope.user_id = user_id
      $scope.projectId = globalUser.projectId
      $scope.new_plan_name = 'Untitled Plan'

      $scope.plan = null
      $scope.plans = []

      var ids = 0
      var customLoc = {};

      var search;

      this.$onInit = function () {
        $scope.showCombo()
      };

      $scope.showCombo = () => {
        $scope.loadPlans(1, () => {
          //Load search value
          loadSearch()
          tracker.track('Open Analysis')

          reloadCurrentLocation();
        })
      }

      function loadSearch() {
        search = $('#create-new-plan .select2')

        search.select2({
          placeholder: 'Search an address, city, state or CLLI code', // config.ui.default_form_values.create_plan.select_area_text,
          ajax: {
            url: '/search/addresses',
            dataType: 'json',
            delay: 250,
            data: (term) => ({ text: term }),
            results: (data, params) => {
              var items = [];
              data.forEach((location) => {
                items.push(
                  {
                    id: 'id-' + (++ids),
                    text: location.name,
                    bounds: location.bounds,
                    centroid: location.centroid
                  }
                );
              })

              $scope.search_results = items
              return {
                results: items,
                pagination: {
                  more: false
                }
              }
            },
            cache: true
          },
          initSelection: function (select, callback) {
            callback(customLoc)
          },
        }).on('change', (e) => {
          var selected = e.added
          if (selected) {
            $scope.new_plan_area_name = selected.text
            $scope.new_plan_area_bounds = selected.bounds
            $scope.new_plan_area_centroid = selected.centroid
          }
        })
      }

      // If we use this more than once it should be more generalized...
      $scope.clear_default_text = () => {
        $scope.new_plan_name = ''
      }

      var interval = null

      $scope.loadPlans = function (page, callback) {
        clearInterval(interval)
        $scope.currentPage = page || 1
        $scope.maxResults = 10
        if (page > 1) {
          var start = $scope.maxResults * (page - 1);
          var end = start + $scope.maxResults;
          $scope.plans = $scope.allPlans.slice(start, end);
          return;
        }

        var load = (callback) => {

          var planOptions = {
            url: '/service/v1/plan-summary',
            method: 'GET',
            params: {
              user_id: $scope.user_id
              // search: $scope.search_text
              // project_id: $scope.projectId
            }
          }
          $http(planOptions)
            .then((response) => {
              $http.get('/optimization/processes').then((running) => {
                response.data.forEach((plan) => {
                  var info = running.data.find((status) => status.planId === +plan.id)
                  if (info) {
                    var diff = (Date.now() - new Date(info.startDate).getTime()) / 1000
                    var min = Math.floor(diff / 60)
                    var sec = Math.ceil(diff % 60)
                    plan.progressString = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec} Runtime`
                    plan.progress = info.progress
                    plan.startDate = info.startDate
                    plan.optimizationState = info.optimizationState
                  }
                })
                $scope.allPlans = response.data
                $scope.plans = response.data.slice(0, $scope.maxResults);
                // $scope.pages = response.data.pages
                $scope.pages = [];
                var pageSize = Math.floor(response.data.length / $scope.maxResults) + (response.data.length % $scope.maxResults > 0 ? 1 : 0);
                for (var i = 1; i <= pageSize; i++) {
                  $scope.pages.push(i);
                }

                callback && callback()
              })
            })
        }
        load(callback)
        interval = setInterval(load, 100000)
      }

      $scope.saveNewPlan = () => {
        var params = {
          name: $scope.new_plan_name,
          areaName: $scope.new_plan_area_name,
          latitude: $scope.new_plan_area_centroid.coordinates[1],
          longitude: $scope.new_plan_area_centroid.coordinates[0],
          projectId: $scope.projectId
        }

        $http.post('/service/v1/plan?user_id=' + $scope.user_id, params).then((response) => {
          $scope.selectPlan(response.data)
          $scope.loadPlans()
        })
      }

      $scope.selectPlan = function (plan) {
        $scope.plan = plan
        state.loadPlan(plan.id)
        state.networkPlanModal.next(false)
      }

      function reloadCurrentLocation() {
        var center = map.getCenter();
        geoCode(center).then(function (address) {
          fetchLocation(address).then(function (location) {
            customLoc = location
            $(search[0]).select2('val', location, true);
          })
        })
      }

      function geoCode(latlng) {
        var promise = $q.defer()

        var geocoder = new google.maps.Geocoder;
        geocoder.geocode({ 'location': latlng }, function (results, status) {
          if (status === 'OK') {
            if (results[1]) {
              promise.resolve({ message: results[0].formatted_address });
            } else {
              promise.reject({ error: 'No results found' });
            }
          } else {
            promise.reject({ error: 'Geocoder failed due to: ' + status })
          }
        });

        return promise.promise;
      }

      function fetchLocation(location) {
        return $http.get("/search/addresses", { params: { text: location.message } }).then(function (results) {

          var location = results.data[0];
          var loc = {
            id: 'id-' + (++ids),
            text: location.name,
            bounds: location.bounds,
            centroid: location.centroid,
            geocoded: true
          };

          return loc;

        });
      }


      $scope.$watch(function () { return $scope.visible; }, function (value) {
        if (value == true) {
          $scope.saveNewPlan()
        }
      });
    }
  }
})