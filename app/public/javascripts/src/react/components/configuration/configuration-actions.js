/* globals FormData */
import Actions from '../../common/actions'

function setClientId (clientId) {
  return {
    type: Actions.CONFIGURATION_SET_CLIENT_ID,
    payload: clientId
  }
}

export default {
  setClientId
}
