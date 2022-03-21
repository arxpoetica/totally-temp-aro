import Actions from '../../common/actions'

const initialOffset = 0
const initialcurrentPage = 0
const perPage = 10

const defaultState = {
  systemActors: [],
  authRoles: {},
  authPermissions: {},
  userConfiguration: null,
  projectTemplates: null,
  userList: null,
  allGroups: null,
  isOpenSendMail: false,
  isOpenNewUser:false,
  pageableData:{
    offset: initialOffset,
    perPage: perPage,
    currentPage: initialcurrentPage,
    pageCount: 0,
    paginateData: []
  },
  defaultGroup : null,
  searchText:'',
  filteredUsers : null
}

// Set the currently logged in user
function setLoggedInUser (state, loggedInUser) {
  return { ...state,
    loggedInUser: loggedInUser
  }
}

function setLoggedInUserProject (state, projectId) {
  return {
    ...state,
    loggedInUser: { 
      ...loggedInUser,
      projectId: projectId 
    }
  }
}

// Set all the system actors (i.e. users and groups)
function setSystemActors (state, systemActors) {
  return { ...state,
    systemActors: systemActors
  }
}

function setAuthRoles (state, authRoles) {
  return { ...state,
    authRoles: { ...state.authRoles, ...authRoles }
  }
}

function setAuthPermissions (state, authPermissions) {
  return { ...state,
    authPermissions: { ...state.authPermissions, ...authPermissions }
  }
}

function updateLoggedInUser (state, user) {
  return { ...state,
    loggedInUser: { ...state.loggedInUser,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    }
  }
}

function setUserConfiguration (state, userConfiguration) {
  return { ...state,
    userConfiguration: userConfiguration
  }
}

function setProjectTemplates (state, projectTemplates) {
  return { ...state,
    projectTemplates: projectTemplates
  }
}

function setUserList (state, users) {
  
  let mapIdToGroup = {}
  state.allGroups.forEach((group) => mapIdToGroup[group.id] = group)

  let filteredUsers = []
  let allUsers = users
  // For a user we will get the IDs of the groups that the user belongs to. Our control uses objects to bind to the model.
  // Remove the group ids property and replace it with group objects
  allUsers.forEach((user, index) => {
    var selectedGroupObjects = []
    user.groupIds.forEach((userGroupId) => selectedGroupObjects.push(mapIdToGroup[userGroupId]))
    allUsers[index].userGroups = selectedGroupObjects // Make sure you modify the object and not a copy
    allUsers[index].isUpdated = false
    delete allUsers[index].groupIds
  })

  // if there is searchtext, we filter the userlist
  if (state.searchText === '') {
    filteredUsers = allUsers
  } else {
    // For now do search in a crude way. Will get this from the ODATA endpoint later
    allUsers.forEach((user) => {
      if ((JSON.stringify(user).toLowerCase()).indexOf(state.searchText.toLowerCase()) >= 0) {
        filteredUsers.push(user)
      }
    })
  }

  // Set Pagination Data
  let pageCount = Math.ceil(filteredUsers.length / perPage)
  let paginateData = filteredUsers.slice(initialOffset, initialOffset + perPage) 

  let pageableData = {}
  pageableData['pageCount'] = pageCount
  pageableData['paginateData'] = paginateData
  pageableData['offset'] = initialOffset
  pageableData['perPage'] = perPage
  pageableData['currentPage'] = initialcurrentPage

  return { ...state,
    userList: allUsers,
    isOpenSendMail: false,
    isOpenNewUser: false,
    pageableData: pageableData,
    filteredUsers : filteredUsers
  }
}

function setPageData (state, selectedPage) {

  let allUsers = '';
  if(state.filteredUsers != null){
    allUsers = state.filteredUsers
  } else{
    allUsers = state.userList
  }

  const offset = selectedPage * perPage; 
  let paginateData = allUsers.slice(offset, offset + perPage) 

  let pageableData = state.pageableData
  pageableData['paginateData'] = paginateData
  pageableData['offset'] = offset
  pageableData['currentPage'] = selectedPage

  return { ...state,
    pageableData: pageableData
  }
}

function searchUsers (state,searchText) {
  let filteredUsers = []
  let userList = state.userList
  if (searchText === '') {
    filteredUsers = userList
  } else {
    // For now do search in a crude way. Will get this from the ODATA endpoint later
    userList.forEach((user) => {
      if ((JSON.stringify(user).toLowerCase()).indexOf(searchText.toLowerCase()) >= 0) {
        filteredUsers.push(user)
      }
    })
  }
  
  // Set Pagination Data
  let pageCount = Math.ceil(filteredUsers.length / perPage)
  let paginateData = filteredUsers.slice(initialOffset, initialOffset + perPage) 

  let pageableData = {}
  pageableData['pageCount'] = pageCount
  pageableData['paginateData'] = paginateData
  pageableData['offset'] = initialOffset
  pageableData['currentPage'] = initialcurrentPage

  return { ...state,
    isOpenSendMail: false,
    isOpenNewUser: false,
    pageableData: pageableData,
    filteredUsers : filteredUsers,
    searchText: searchText
  }
  
}

function setAllGroups (state, groups) {

  let defaultGroup = []
  groups.forEach((group) => {
    if (group.name === 'Public') {
      defaultGroup.push(group)
    }
  })

  return { ...state,
    allGroups: groups,
    defaultGroup : defaultGroup
  }
}

function setMailFlag (state, groups) {
  return { ...state,
    isOpenSendMail: true,
    isOpenNewUser: false
  }
}

function setNewUserFlag (state, groups) {
  return { ...state,
    isOpenSendMail: false,
    isOpenNewUser: true
  }
}

function userReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.USER_GET_SUPERUSER_FLAG:
      return state

    case Actions.USER_SET_LOGGED_IN_USER:
      return setLoggedInUser(state, action.payload)

    case Actions.USER_SET_LOGGED_IN_USER_PROJECT:
      return setLoggedInUserProject(state, action.payload)

    case Actions.USER_UPDATE_USER:
      return updateLoggedInUser(state, action.payload)

    case Actions.USER_SET_SYSTEM_ACTORS:
      return setSystemActors(state, action.payload)

    case Actions.USER_SET_AUTH_ROLES:
      return setAuthRoles(state, action.payload)

    case Actions.USER_SET_AUTH_PERMISSIONS:
      return setAuthPermissions(state, action.payload)
    
    case Actions.USER_SET_CONFIGURATION:
       return setUserConfiguration(state, action.payload)

    case Actions.USER_PROJECT_TEMPLATES:
      return setProjectTemplates(state, action.payload)

    case Actions.USER_SET_USERLIST:
      return setUserList(state, action.payload)
    
    case Actions.USER_SET_GROUP:
      return setAllGroups(state, action.payload)

    case Actions.USER_SET_SEND_MAIL_FLAG:
      return setMailFlag(state, action.payload)
    
    case Actions.USER_SET_NEW_USER_FLAG:
      return setNewUserFlag(state, action.payload)

    case Actions.USER_HANDLE_PAGE_CLICK:
      return setPageData(state, action.payload)

    case Actions.USER_SEARCH_USERS:
      return searchUsers(state, action.payload)
      
      default:
      return state
  }
}

export default userReducer
