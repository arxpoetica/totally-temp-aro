app.directive('networkPlanManage', function () {
  return {
    restrict: 'E',
    transclude: true,
    replace: true,
    templateUrl: '/components/header/network-plan-manage-component.html',
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