function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {

    // Configure Idle settings
    $urlRouterProvider.otherwise("/maps/streetview");

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

        .state('maps', {
            abstract: true,
            url: "/maps",
            templateUrl: "views/common/content.html",
        })
        .state('maps.streetview', {
            url: "/streetview",
            templateUrl: "views/street.html",
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([]);
                },
                metadata: function ($rootScope, $http) {
                    return $http.get("app/metadata.json").then(function (response) {
                        $rootScope.METADATA = response.data;
                    });
                },
                data: function ($rootScope, $http) {
                    $http.get("app/back_bay.json").then(function (response) {
                        $rootScope.DATA = response.data;
                    });
                }
            }
        })

}
angular
    .module('street')
    .config(config)
    .run(function ($rootScope, $state, $http) {
        $rootScope.$state = $state;
    });
