const Actions = Object.freeze({

  // Plan
  SET_PLAN: 'SET_PLAN',

  // Coverage
  SET_DEFAULT_COVERAGE_DETAILS: 'SET_DEFAULT_COVERAGE_DETAILS',
  UPDATE_COVERAGE_STATUS: 'UPDATE_COVERAGE_STATUS',
  INITIALIZE_COVERAGE: 'INITIALIZE_COVERAGE',
  MODIFY_COVERAGE: 'MODIFY_COVERAGE',
  SET_COVERAGE_PROGRESS: 'SET_COVERAGE_PROGRESS',

  // Websocket communication with server
  SOCKET_SUBSCRIBE_TO_ROOM: 'SOCKET_SUBSCRIBE_TO_ROOM',

  // User
  SET_LOGGED_IN_USER: 'SET_LOGGED_IN_USER',
  GET_SUPERUSER_FLAG: 'GET_SUPERUSER_FLAG',
  SET_SUPERUSER_FLAG: 'SET_SUPERUSER_FLAG'

})

export default Actions