// Permission bits. This should correspond to database table auth.permission
export default Object.freeze({
  RESOURCE_ADMIN: 1,
  RESOURCE_WRITE: 2,
  RESOURCE_READ: 4,
  USER_ADMIN: 8,
  USER_VIEW: 16,
  RESOURCE_WORKFLOW: 32
})
