var STREET_APP = angular.module('street', [
    'ui.router',                    // Routing
    'oc.lazyLoad'                 // ocLazyLoad
]);

// Other libraries are loaded dynamically in the config.js file using the library ocLazyLoad