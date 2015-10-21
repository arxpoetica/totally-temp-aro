app.service('map_tools', ['$rootScope', function($rootScope) {

  var tools = {};
  var visible = [];
  var collapsed = {};

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

  tools.expand = function(name) {
    delete collapsed[name];
  }

  tools.collapse = function(name) {
    collapsed[name] = true;
  }

  tools.is_expanded = function(name) {
    return !collapsed[name];
  }

  tools.available_tools = [
    {
      id: 'locations',
      name: 'Locations',
      short_name: 'L',
    },
    {
      id: 'boundaries',
      name: 'Boundaries',
      short_name: 'B',
    },
    {
      id: 'network_nodes',
      name: 'Network Equipment',
      short_name: 'E',
    },
    {
      id: 'fiber_plant',
      name: 'Competitor Networks',
      short_name: 'F',
    },
  ];

  return tools;

}]);
