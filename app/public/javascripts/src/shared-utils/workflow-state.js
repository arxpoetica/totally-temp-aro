// This should match values in table aro.workflow_state
const WorkflowState = Object.freeze({
  UNDEFINED: {
    id: 0,
    name: 'UNDEFINED'
  },
  CREATED: {
    id: 1,
    name: 'CREATED'
  },
  LOCKED: {
    id: 2,
    name: 'LOCKED'
  },
  INVALIDATED: {
    id: 4,
    name: 'INVALIDATED'
  }
})

export default WorkflowState
