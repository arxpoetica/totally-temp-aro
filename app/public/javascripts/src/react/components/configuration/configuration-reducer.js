import Actions from '../../common/actions'

const defaultState = {
  items: [],
  assetKeys: []
}

function setConfiguration (state, configuration) {
  return { ...state,
    items: configuration
  }
}

function setAssetKeys (state, assetKeys) {
  return { ...state,
    assetKeys: assetKeys
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.CONFIGURATION_SET_CONFIGURATION:
      return setConfiguration(state, action.payload)

    case Actions.CONFIGURATION_SET_ASSET_KEYS:
      return setAssetKeys(state, action.payload)

    default:
      return state
  }
}

export default configurationReducer
