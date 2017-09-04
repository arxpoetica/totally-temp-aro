app.component('networkPlan', {
  template: `
  <style scoped>

    .network-plan {
      top: 0px;
      white-space: nowrap;
      right: 0px;
      position: absolute;
      background: #1a79db;
      padding: 7px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    .network-plan-load {
      font-size: 25px;
      padding-left: 10px;
      padding-right: 10px;
      line-height: 46px;
      cursor: pointer;
    }

    .network-plan:hover, .network-plan-load:hover, .network-plan span:hover {
      color: #ccc
    }
    
  </style>

  <div class="network-plan">
    <div class="network-plan-load" ng-click="showCombo()">
      <span ng-if="plan.name">{{plan.name}}</span>
      <span ng-if="!plan.name"><i class="fa fa-plus f-select-plan" style="font-size: 12px"></i> Select a plan</span>
    </div>
  </div>
  `,
  bindings: {},
  controller: function($scope, $http, $q, $rootScope, state, tracker) {
    this.state = state;
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
        initSelection : function (select, callback) {
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

    // $scope.currentPage = 1
    // $scope.pages = [1]
    // $scope.planView ='add';

    // If we use this more than once it should be more generalized...
    $scope.clear_default_text = () => {
      $scope.new_plan_name = ''
    }
    
    $scope.showCombo = () => {
      $scope.loadPlans(1, () => {
        //Load search value
        loadSearch()
        state.networkPlanModal.next(true)
        // $('#plan-combo').modal('show')
        tracker.track('Open Analysis')
  
        reloadCurrentLocation();
      })
    }

    var interval = null

    $scope.loadPlans = function (page, callback) {
      clearInterval(interval)
      $scope.currentPage = page || 1
      $scope.maxResults = 10
      if(page > 1) {
        var start = $scope.maxResults * (page - 1);
        var end   = start + $scope.maxResults;
        $scope.plans = $scope.allPlans.slice(start, end);
        return;
      }
  
      var load = (callback) => {
  
        var planOptions = {
          url: '/service/v1/plan',
          method: 'GET',
          params: {
            user_id: $scope.user_id,
            search: $scope.search_text,
            project_id: $scope.projectId
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
        state.networkPlanModal.next(false)
        $scope.loadPlans()
      })
    }

    // $rootScope.$on('go-home', () => {
    //   $scope.selectPlan(null)
    // })

    $rootScope.$on('network-plan-component:select-plan', (e, new_plan_name) => {
      $scope.new_plan_name = new_plan_name
      $scope.saveNewPlan()
    })
      
    $scope.selectPlan = function (plan) {
      $scope.plan = plan
      // $('#plan-saving').stop().hide()
      // $('#plan-saved').stop().hide()
      // $('#plan-saving-progress').hide()
      state.loadPlan(plan)
      // $rootScope.$broadcast('plan_selected', plan)
      state.networkPlanModal.next(false)
    }

    function reloadCurrentLocation() {
      var center = map.getCenter();
      geoCode(center).then(function (address) {
        fetchLocation(address).then(function (location) {
          customLoc = location
          $(search[0]).select2('val' , location ,true);
        })
      })
    }

    function geoCode(latlng) {
      var promise = $q.defer()
  
      var geocoder = new google.maps.Geocoder;
      geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === 'OK') {
          if (results[1]) {
            promise.resolve({message : results[0].formatted_address});
          } else {
            promise.reject({error : 'No results found'});
          }
        } else {
          promise.reject({error : 'Geocoder failed due to: ' + status})
        }
      });
  
      return promise.promise;
    }

    function fetchLocation(location) {
      return $http.get("/search/addresses" , {params : {text : location.message}}).then(function (results) {
  
        var location = results.data[0];
        var loc = {
          id: 'id-' + (++ids),
          text: location.name,
          bounds: location.bounds,
          centroid: location.centroid,
          geocoded : true
        };
  
        return loc;
  
      });
    }

  }
})