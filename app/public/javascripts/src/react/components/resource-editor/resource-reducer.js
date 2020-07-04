import Actions from '../../common/actions'

	const initialOffset = 0
	const initialcurrentPage = 0
	const perPage = 5
	
	const ResourceKey = {
		price_book: true,
		rate_reach_manager: true,
		competition_manager: true
	};

	const defaultState = {
		resourceTypes: null,
		resourceManagers: null,
		filteredresourceManagers : null,
		pageableData:{
			offset: initialOffset,
			perPage: perPage,
			currentPage: initialcurrentPage,
			pageCount: 0,
			paginateData: []
		},
		isMakeNewFilter: false,
		isResourceEditor : true,
    priceBookStrategy : null,
    arpuManagerConfiguration : null,
    pristineArpuManagerConfiguration : null,
    ArpuStrategy : '',
    ArpuRevenue : ''
	}

  function setResourceTypes (state, resourceTypes) {
    return { ...state,
			isResourceEditor : true,
			resourceTypes: resourceTypes
    }
  }

  function setResourceManagers (state, allresourceManagers) {

		var resourceManagers = allresourceManagers
		.filter((item) => item.deleted !== true)

    // Set Pagination Data
    let pageCount = Math.ceil(resourceManagers.length / perPage)
    let paginateData = resourceManagers.slice(initialOffset, initialOffset + perPage) 

    let pageableData = {}
    pageableData['pageCount'] = pageCount
    pageableData['paginateData'] = paginateData
    pageableData['offset'] = initialOffset
    pageableData['perPage'] = perPage
    pageableData['currentPage'] = initialcurrentPage

		return { ...state,
			isResourceEditor : true,
			resourceManagers: resourceManagers,
			pageableData: pageableData,
			filteredresourceManagers : null
		}
  }

  function setPageData (state, selectedPage) {

    let resourceManagerslist = '';
    if(state.filteredresourceManagers != null){
      resourceManagerslist = state.filteredresourceManagers
    } else{
      resourceManagerslist = state.resourceManagers
    }

    const offset = selectedPage * perPage; 
    let paginateData = resourceManagerslist.slice(offset, offset + perPage) 
  
    let pageableData = state.pageableData
    pageableData['paginateData'] = paginateData
    pageableData['offset'] = offset
    pageableData['currentPage'] = selectedPage

    return { ...state,
      pageableData: pageableData
    }
  }

  function searchManagers (state,searchText) {

    let filteredresourceManagers = []
    let resourceManagersList = state.resourceManagers
    if (searchText === '' || searchText === 'All') {
      filteredresourceManagers = resourceManagersList
    } else {
      // For now do search in a crude way. Will get this from the ODATA endpoint later
      resourceManagersList.forEach((manager) => {
        if ((JSON.stringify(manager).toLowerCase()).indexOf(searchText.toLowerCase()) >= 0) {
          filteredresourceManagers.push(manager)
        }
      })
    }
    
    // Set Pagination Data
    let pageCount = Math.ceil(filteredresourceManagers.length / perPage)
    let paginateData = filteredresourceManagers.slice(initialOffset, initialOffset + perPage) 
  
    let pageableData = {}
    pageableData['pageCount'] = pageCount
    pageableData['paginateData'] = paginateData
    pageableData['offset'] = initialOffset
    pageableData['currentPage'] = initialcurrentPage
  
    return { ...state,
      pageableData: pageableData,
      filteredresourceManagers : filteredresourceManagers
    }
  }

  function setcanMakeNewFilter (state,filterText) {
    let isMakeNewFilter =  ResourceKey.hasOwnProperty(filterText)
    return { ...state,
      isMakeNewFilter: isMakeNewFilter
    }
  }

  function setIsResourceEditor (state,filterText) {
    return { ...state,
      isResourceEditor: false
    }
  }

  function setPriceBookStrategy (state, priceBookStrategy) {
    return { ...state,
      priceBookStrategy: priceBookStrategy
    }
  }

  function setArpuManagerConfiguration (state, arpuManagerConfiguration) {
    return { ...state,
      arpuManagerConfiguration: arpuManagerConfiguration
    }
  }

  function setPristineArpuManagerConfiguration (state, pristineArpuManagerConfiguration) {
    return { ...state,
      pristineArpuManagerConfiguration: pristineArpuManagerConfiguration
    }
  }

  function setArpuStrategy (state, ArpuStrategy) {
    return { ...state,
      ArpuStrategy : ArpuStrategy
    }
  }

  function setArpuRevenue (state, ArpuRevenue) {
    return { ...state,
      ArpuRevenue : ArpuRevenue
    }
  }

  function resourceReducer (state = defaultState, action) {
    switch (action.type) {
			case Actions.RESOURCE_EDITOR_SET_RESOURCE_TYPES:
				return setResourceTypes(state, action.payload)

			case Actions.RESOURCE_EDITOR_SET_RESOURCE_MANAGERS:
				return setResourceManagers(state, action.payload)

			case Actions.RESOURCE_EDITOR_HANDLE_PAGE_CLICK:
				return setPageData(state, action.payload)

			case Actions.RESOURCE_EDITOR_SEARCH_MANAGERS:
				return searchManagers(state, action.payload)

			case Actions.RESOURCE_EDITOR_CAN_MAKE_NEW_FILTER:
				return setcanMakeNewFilter(state, action.payload)  

			case Actions.RESOURCE_EDITOR_IS_RESOURCE_EDITOR:
				return setIsResourceEditor(state, action.payload)   

			case Actions.RESOURCE_EDITOR_GET_PRICEBOOK_STRATEGY:
        return setPriceBookStrategy(state, action.payload)
        
      case Actions.RESOURCE_EDITOR_SET_ARPU_MANAGER_CONFIGURATION:
        return setArpuManagerConfiguration(state, action.payload)
        
      case Actions.RESOURCE_EDITOR_SET_PRISTINE_ARPU_MANAGER_CONFIGURATION:
        return setPristineArpuManagerConfiguration(state, action.payload)        

      case Actions.RESOURCE_EDITOR_SET_ARPU_STRATEGY:
        return setArpuStrategy(state, action.payload)    
        
      case Actions.RESOURCE_EDITOR_SET_ARPU_REVENUE:
        return setArpuRevenue(state, action.payload)  

    default:
      return state
    }
  }

export default resourceReducer

