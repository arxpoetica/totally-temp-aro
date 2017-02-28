var STREET_APP = angular.module('street', [
    'ui.router',                    // Routing
    'oc.lazyLoad',                 // ocLazyLoad
    'ui.bootstrap',
    'ui.toggle'
]);

// Other libraries are loaded dynamically in the config.js file using the library ocLazyLoad