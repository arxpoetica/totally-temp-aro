/* global app config $ */
app.service('map_tools', ['$rootScope', 'tracker', 'state', '$document', ($rootScope, tracker, state, $document) => {
  var tools = state.reduxMapTools.tools
  var visible = state.reduxMapTools.visible
  var collapsed = state.reduxMapTools.collapsed
  var disabled = state.reduxMapTools.disabled

  var accordion = $('#map-tools-accordion')

  $document.on('keydown keyup', (event) => hideModal(event))
  window.addEventListener('reduxMaptoolChanged', (e) => {
    collapsed = e.detail.collapsed
    tools = e.detail.tools
    visible = e.detail.visible
    disabled = e.detail.disabled
  })

  function hideModal (e) {
    if (e.keyCode == 27) {
      var visibleModal = _.filter(tools.available_tools, (tool) => tool.id == visible[0])
      visibleModal.map(tools.toggle)
      $rootScope.$broadcast('map_tool_esc_clear_view_mode')
      state.setReduxMapTools({ tools, visible, collapsed, disabled })
      if (!$rootScope.$$phase) { $rootScope.$apply() }
    }
  }

  accordion.on('click', '[data-parent="#map-tools-accordion"]', (e) => {
    e.preventDefault()
  })
  accordion.on('show.bs.collapse', (e) => {
    var tool = $(e.target).attr('data-tool')
    tools.show(tool)
    state.setReduxMapTools({ tools, visible, collapsed, disabled })
  })

  tools.enable = (name) => {
    var i = disabled.indexOf(name)
    if (i >= 0) {
      disabled.splice(i, 1)
      $rootScope.$broadcast('map_tool_changed_availability', name)
      state.setReduxMapTools({ tools, visible, collapsed, disabled })
    }
  }

  tools.disable = (name) => {
    var i = disabled.indexOf(name)
    if (i === -1) {
      disabled.push(name)
      $rootScope.$broadcast('map_tool_changed_availability', name)
      state.setReduxMapTools({ tools, visible, collapsed, disabled })
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
        state.setReduxMapTools({ tools, visible, collapsed, disabled })
      }
    })
    // --
    visible.push(name)
    $rootScope.$broadcast('map_tool_changed_visibility', name)
    state.setReduxMapTools({ tools, visible, collapsed, disabled })
  }

  tools.hide = (name) => {
    var i = visible.indexOf(name)
    if (i >= 0) {
      visible.splice(i, 1)
      $rootScope.$broadcast('map_tool_changed_visibility', name)
      state.setReduxMapTools({ tools, visible, collapsed, disabled })
    }
  }

  tools.toggle = (tool) => {
    var name = tool.id
    if (!$rootScope.currentPlan && tool.needsPlan) {
      $rootScope.$broadcast('show_create_plan_dialog')
      return
    }
    tools.is_visible(name) ? tools.hide(name) : tools.show(name)
  }

  tools.expand = (name) => {
    delete collapsed[name]
    state.setReduxMapTools({ tools, visible, collapsed, disabled })
  }

  tools.collapse = (name) => {
    collapsed[name] = true
    state.setReduxMapTools({ tools, visible, collapsed, disabled })
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
    AREA_NETWORK_PLANNING: 'area_network_planning',
    TARGET_BUILDER: 'target_builder',
    CONSTRUCTION_SITES: 'construction_sites',
  }

  tools.available_tools = [
    {
      id: tools.TOOL_IDS.COPPER,
      name: 'Copper',
      icon: 'fa fa-draw-polygon fa-2x',
    },
    {
      id: tools.TOOL_IDS.CONDUITS,
      name: 'Conduits',
      icon: 'fas fa-road fa-2x',
    },
  ]

  return tools
}])
