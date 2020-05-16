import Actions from '../../common/actions'
// import AroHttp from '../../common/aro-http'
import uuidStore from '../../../shared-utils/uuid-store'

function setSelectedDuctId (ductId) {
  return {
    type: Actions.DATA_DUCT_SET_SELECTED_DUCT_ID,
    payload: ductId
  }
}

function deleteAllDucts () {
  return {
    type: Actions.DATA_DUCT_SET_DUCTS,
    payload: {}
  }
}

function newDuct (duct) {
  var newDuctId = uuidStore.getUUID()
  return {
    type: Actions.DATA_DUCT_SET_DUCT,
    payload: {
      ductId: newDuctId,
      duct: duct
    }
  }
}

function setDuct (ductId, duct) {
  return {
    type: Actions.DATA_DUCT_SET_DUCT,
    payload: {
      ductId: ductId,
      duct: duct
    }
  }
}

export default {
  setSelectedDuctId,
  deleteAllDucts,
  newDuct,
  setDuct
}
