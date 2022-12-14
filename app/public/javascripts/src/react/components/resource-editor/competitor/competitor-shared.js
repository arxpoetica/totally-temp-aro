export const RECALC_STATES = Object.freeze({
  VALID: 'VALID',
  DIRTY: 'DIRTY',
  RECALCULATING: 'RECALCULATING',
})

export const RECALC_EVENT_TYPES = Object.freeze({
  MODIFY: 'MODIFY',
  REBUILD_STARTED: 'REBUILD_STARTED',
  REBUILD_ENDED: 'REBUILD_ENDED',
  REBUILD_FAILED: 'REBUILD_FAILED',
})
