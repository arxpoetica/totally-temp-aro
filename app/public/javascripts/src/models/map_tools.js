/* global app config $ */
app.service('map_tools', ['$rootScope', 'tracker', 'state','$document', ($rootScope, tracker, state, $document) => {
  var tools = {}
  var visible = []
  var collapsed = {}
  var disabled = []

  var accordion = $('#map-tools-accordion')

  $document.on("keydown keyup",(event) => hideModal(event))

  function hideModal(e) {
    if (e.keyCode == 27) {
      var visibleModal = _.filter(tools.available_tools, (tool) => tool.id == visible[0])
      visibleModal.map(tools.toggle)
      $rootScope.$broadcast('map_tool_esc_clear_view_mode')
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }
  }

  accordion.on('click', '[data-parent="#map-tools-accordion"]', (e) => {
    e.preventDefault()
  })
  accordion.on('show.bs.collapse', (e) => {
    var tool = $(e.target).attr('data-tool')
    tools.show(tool)
  })

  tools.enable = (name) => {
    var i = disabled.indexOf(name)
    if (i >= 0) {
      disabled.splice(i, 1)
      $rootScope.$broadcast('map_tool_changed_availability', name)
    }
  }

  tools.disable = (name) => {
    var i = disabled.indexOf(name)
    if (i === -1) {
      disabled.push(name)
      $rootScope.$broadcast('map_tool_changed_availability', name)
    }
  }

  tools.isEnabled = (name) => {
    return disabled.indexOf(name) === -1
  }

  tools.is_visible = (name) => {
    return visible.indexOf(name) >= 0 && tools.isEnabled(name)
  }

  tools.show = (name) => {
    // For now only one tool can be visible at a time
    visible.splice(0).forEach((tool) => {
      if (tool !== name) {
        $rootScope.$broadcast('map_tool_changed_visibility', tool)
      }
    })
    // --
    visible.push(name)
    $rootScope.$broadcast('map_tool_changed_visibility', name)
    tracker.track('Show Layer', { layer: name })
  }

  tools.hide = (name) => {
    var i = visible.indexOf(name)
    if (i >= 0) {
      visible.splice(i, 1)
      $rootScope.$broadcast('map_tool_changed_visibility', name)
    }
  }

  tools.toggle = (tool) => {
    var name = tool.id;
     if(!$rootScope.currentPlan && tool.needsPlan){
       $rootScope.$broadcast('show_create_plan_dialog')
       return;
     }
    tools.is_visible(name) ? tools.hide(name) : tools.show(name)
  }

  tools.expand = (name) => {
    delete collapsed[name]
  }

  tools.collapse = (name) => {
    collapsed[name] = true
  }

  tools.is_expanded = (name) => {
    return !collapsed[name]
  }

  tools.get_tool_name = (id) => {
    for (var i = 0; i < tools.available_tools.length; i++) {
      if (tools.available_tools[i]['id'] == id) { // eslint-disable-line
        return tools.available_tools[i]['name']
      }
    }
  }

  tools.TOOL_IDS = {
    LOCATIONS: 'locations',
    AREA_NETWORK_PLANNING: 'area_network_planning',
    TARGET_BUILDER: 'target_builder',
    CONSTRUCTION_SITES: 'construction_sites'
  }

  tools.available_tools = [
    {
      id: tools.TOOL_IDS.LOCATIONS,
      name: 'Locations',
      short_name: 'L',
      icon: 'fa fa-building fa-2x'
    },
    {
      id: 'network_nodes',
      name: 'Network Equipment',
      short_name: 'E',
      icon: 'fa fa-sitemap fa-2x'
    },
    {
      id: tools.TOOL_IDS.CONSTRUCTION_SITES,
      name: 'Construction Sites',
      short_name: 'C',
      icon: 'fa fa-wrench fa-2x'
    },
    {
      id: 'fiber_plant',
      name: 'Competitor Networks',
      short_name: 'F',
      icon: 'fa fa-flag-checkered fa-2x'
    },
    {
      id: 'boundaries',
      name: 'Boundaries',
      short_name: 'B',
      icon: 'fa fa-th fa-2x'
    }
  ]

  if (config.ARO_CLIENT === 'demo') {
    var tool = tools.available_tools.find((item) => item.id === tools.TOOL_IDS.AREA_NETWORK_PLANNING)
    tools.available_tools.splice(tools.available_tools.indexOf(tool), 1)
  }

  return tools
}])
