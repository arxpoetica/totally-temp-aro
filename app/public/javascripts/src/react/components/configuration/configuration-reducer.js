import Actions from '../../common/actions'

const defaultState = {
  items: [],
  assetKeys: [],
  reports: {
    metaData: [],
    reportBeingEdited: null,
    validation: null
  }
}

const defaultSubDefinition = {
  name: 'sub_definition',
  displayName: 'Sub Definition',
  query: '',
  queryType: 'SQL_REPORT'
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

function setReportsMetaData (state, reportsMetaData) {
  return { ...state,
    reports: { ...state.reports,
      metaData: reportsMetaData
    }
  }
}

function setReportIdBeingEdited (state, reportIdToEdit) {
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: {
        id: reportIdToEdit
      }
    }
  }
}

function clearReportBeingEdited (state) {
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: null,
      validation: null
    }
  }
}

function setReportDefinitionBeingEdited (state, reportDefinition) {
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: reportDefinition
    }
  }
}

function setPrimaryReportDefinitionBeingEdited (state, primaryReportDefinition) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: { ...state.reports.reportBeingEdited,
        moduleDefinition: { ...state.reports.reportBeingEdited.moduleDefinition,
          definition: primaryReportDefinition
        }
      }
    }
  }
}

function setReportType (state, reportType) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: { ...state.reports.reportBeingEdited,
        reportType: reportType
      }
    }
  }
}

function setReportSubDefinitionBeingEdited (state, subDefinition, subDefinitionIndex) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: { ...state.reports.reportBeingEdited,
        moduleDefinition: { ...state.reports.reportBeingEdited.moduleDefinition,
          subDefinitions: state.reports.reportBeingEdited.moduleDefinition.subDefinitions.map((item, index) => {
            return (index === subDefinitionIndex) ? subDefinition : item
          })
        }
      }
    }
  }
}

function addReportSubDefinition (state) {
  var newSubDefinitions = state.reports.reportBeingEdited.moduleDefinition.subDefinitions.map(item => item)
  console.log(defaultSubDefinition)
  newSubDefinitions.push({ ...defaultSubDefinition })
  console.log(defaultSubDefinition)
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: { ...state.reports.reportBeingEdited,
        moduleDefinition: { ...state.reports.reportBeingEdited.moduleDefinition,
          subDefinitions: newSubDefinitions
        }
      }
    }
  }
}

function removeReportSubDefinition (state, subDefinitionIndex) {
  var newSubDefinitions = state.reports.reportBeingEdited.moduleDefinition.subDefinitions.map(item => item)
  newSubDefinitions.splice(subDefinitionIndex, 1)
  return { ...state,
    reports: { ...state.reports,
      reportBeingEdited: { ...state.reports.reportBeingEdited,
        moduleDefinition: { ...state.reports.reportBeingEdited.moduleDefinition,
          subDefinitions: newSubDefinitions
        }
      }
    }
  }
}

function setReportValidation (state, validation) {
  return { ...state,
    reports: { ...state.reports,
      validation: validation
    }
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
    case Actions.CONFIGURATION_SET_CONFIGURATION:
      return setConfiguration(state, action.payload)

    case Actions.CONFIGURATION_SET_ASSET_KEYS:
      return setAssetKeys(state, action.payload)

    case Actions.CONFIGURATION_SET_REPORTS_METADATA:
      return setReportsMetaData(state, action.payload)

    case Actions.CONFIGURATION_SET_EDITING_REPORT_ID:
      return setReportIdBeingEdited(state, action.payload)

    case Actions.CONFIGURATION_SET_EDITING_REPORT_DEFINITION:
      return setReportDefinitionBeingEdited(state, action.payload)

    case Actions.CONFIGURATION_SET_EDITING_REPORT_PRIMARY_DEFINITION:
      return setPrimaryReportDefinitionBeingEdited(state, action.payload)

    case Actions.CONFIGURATION_SET_EDITING_REPORT_TYPE:
      return setReportType(state, action.payload)

    case Actions.CONFIGURATION_SET_EDITING_REPORT_SUBDEFINITION:
      return setReportSubDefinitionBeingEdited(state, action.payload.subDefinition, action.payload.subDefinitionIndex)

    case Actions.CONFIGURATION_ADD_EDITING_REPORT_SUBDEFINITION:
      return addReportSubDefinition(state)

    case Actions.CONFIGURATION_REMOVE_EDITING_REPORT_SUBDEFINITION:
      return removeReportSubDefinition(state, action.payload)

    case Actions.CONFIGURATION_SET_REPORT_VALIDATION:
      return setReportValidation(state, action.payload)

    case Actions.CONFIGURATION_CLEAR_EDITING_REPORT:
      return clearReportBeingEdited(state)

    default:
      return state
  }
}

export default configurationReducer
