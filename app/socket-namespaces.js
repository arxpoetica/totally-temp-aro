export const CHANNEL_NAMES = Object.freeze({
  CLIENT: 'client',
  PLAN: 'plan',
  USER: 'user',
  LIBRARY: 'library',
  BROADCAST: 'broadcast',
  TILE_INVALIDATION: 'tileInvalidation',
})

export const SOCKET_EVENTS = Object.freeze({
  VECTOR_TILE_DATA: 'VECTOR_TILE_DATA',
  COMMIT_TRANSACTION: 'COMMIT_TRANSACTION',
  USER_TRANSACTION: 'USER_TRANSACTION',
  PLAN_REFRESH: 'PLAN_REFRESH',
  PROGRESS_MESSAGE_DATA: 'PROGRESS_MESSAGE_DATA',
  ETL_ADD: 'ETL_ADD',
  ETL_START: 'ETL_START',
  ETL_UPDATE: 'ETL_UPDATE',
  ETL_CLOSE: 'ETL_CLOSE',
  ETL_ERROR: 'ETL_ERROR',
  SUBNET_DATA: 'SUBNET_DATA',
  ADMIN_BROADCAST: 'ADMIN_BROADCAST',
  COMPETITION_UPDATES: 'COMPETITION_UPDATES',
})
