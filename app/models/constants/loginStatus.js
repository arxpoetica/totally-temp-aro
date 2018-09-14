// This corresponds to entries in the auth.login_status table

const LoginStatus = Object.freeze({
  LOGIN_SUCCESSFUL_CACHED_PASSWORD: 1,
  LOGIN_SUCCESSFUL_EXTERNAL_AUTH: 2,
  INCORRECT_PASSWORD: 3,
  UNDEFINED_ERROR: 4
})

module.exports = LoginStatus
