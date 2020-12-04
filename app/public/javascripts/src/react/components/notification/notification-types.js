const NotificationTypes = Object.freeze({
  'SYSTEM_EXPIRE': 'SYSTEM_EXPIRE', // includes auto-expire and component controlled expire
  'USER_EXPIRE': 'USER_EXPIRE', // persistent, gets an X for the user to close it
})

export default NotificationTypes
