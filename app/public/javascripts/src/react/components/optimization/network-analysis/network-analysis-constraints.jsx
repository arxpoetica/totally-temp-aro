import { reduxForm } from 'redux-form'
import Constants from '../../../common/constants'
import { AroNetworkConstraints } from '../optimization/aro-network-constraints.jsx'

// Wrap the aro-network-constraints component with a Redux form
let NetworkAnalysisConstraintsForm = reduxForm({
  form: Constants.NETWORK_ANALYSIS_CONSTRAINTS
})(AroNetworkConstraints)

export default NetworkAnalysisConstraintsForm
