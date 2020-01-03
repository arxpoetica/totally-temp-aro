import { reduxForm } from 'redux-form'
import Constants from '../../common/constants'
import { AroNetworkConstraints } from '../optimization/aro-network-constraints.jsx'

// Wrap the aro-network-constraints component with a Redux form
let RingOptionsBasicForm = reduxForm({
  form: Constants.RING_OPTIONS_BASIC_FORM
})(AroNetworkConstraints)

export default RingOptionsBasicForm
