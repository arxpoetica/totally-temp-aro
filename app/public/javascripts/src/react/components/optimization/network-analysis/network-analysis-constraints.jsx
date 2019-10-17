import { reduxForm } from 'redux-form'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import Constants from '../../../common/constants'
import { AroNetworkConstraints } from '../aro-network-constraints.jsx'

// Wrap the aro-network-constraints component with a Redux form
let NetworkAnalysisConstraintsForm = reduxForm({
  form: Constants.NETWORK_ANALYSIS_CONSTRAINTS
})(AroNetworkConstraints)

// Wrap the form with a provider

const NetworkAnalysisConstraintsFormComponent = wrapComponentWithProvider(reduxStore, NetworkAnalysisConstraintsForm)
export default NetworkAnalysisConstraintsFormComponent
