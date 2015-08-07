app.service('map_tools', ['$rootScope', function($rootScope) {

  var tools = {};
  var visible = [];

  tools.is_visible = function(name) {
    return visible.indexOf(name) >= 0;
  }

  tools.show = function(name) {
    // For now only one tool can be visible at a time
    visible.splice(0).forEach(function(tool) {
      if (tool !== name) {
        $rootScope.$broadcast('map_tool_changed_visibility', tool);
      }
    });
    // --
    visible.push(name);
    $rootScope.$broadcast('map_tool_changed_visibility', name);
  }

  tools.hide = function(name) {
    var i = visible.indexOf(name);
    if (i >= 0) {
      visible.splice(i, 1);
      $rootScope.$broadcast('map_tool_changed_visibility', name);
    }
  }

  tools.toggle = function(name) {
    tools.is_visible(name) ? tools.hide(name) : tools.show(name);
  }

  tools.available_tools = [
    {
      id: 'route',
      name: 'Route Planner',
      short_name: 'DBR',
    },
    {
      id: 'market_size',
      name: 'Market Size',
      short_name: 'MS',
    },
    {
      id: 'equipment_nodes',
      name: 'Equipment nodes',
      short_name: 'ENT',
    },
  ];

  return tools;

}]);
