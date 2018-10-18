// This should match values in table aro.workflow_state
const WorkflowState = Object.freeze({
  UNDEFINED: 0,
  CREATED: 1,
  LOCKED: 2,
  INVALIDATED: 4
})

export default WorkflowState
