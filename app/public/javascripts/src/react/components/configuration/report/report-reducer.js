import Actions from '../../../common/actions'

const defaultState = {
  metaData: [],
  reportBeingEdited: null,
  validation: null
}

const defaultSubDefinition = {
  name: 'sub_definition',
  displayName: 'Sub Definition',
  query: '',
  queryType: 'SQL_REPORT'
}

function setReportsMetaData (state, reportsMetaData) {
  return { ...state,
    metaData: reportsMetaData
  }
}

function setReportIdBeingEdited (state, reportIdToEdit) {
  return { ...state,
    reportBeingEdited: {
      id: reportIdToEdit
    }
  }
}

function clearReportBeingEdited (state) {
  return { ...state,
    reportBeingEdited: null,
    validation: null
  }
}

function setReportDefinitionBeingEdited (state, reportDefinition) {
  return { ...state,
    reportBeingEdited: reportDefinition
  }
}

function setPrimaryReportDefinitionBeingEdited (state, primaryReportDefinition) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reportBeingEdited: { ...state.reportBeingEdited,
      moduleDefinition: { ...state.reportBeingEdited.moduleDefinition,
        definition: primaryReportDefinition
      }
    }
  }
}

function setReportType (state, reportType) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reportBeingEdited: { ...state.reportBeingEdited,
      reportType: reportType
    }
  }
}

function setReportSubDefinitionBeingEdited (state, subDefinition, subDefinitionIndex) {
  // Nested object, but thats how it comes from service
  return { ...state,
    reportBeingEdited: { ...state.reportBeingEdited,
      moduleDefinition: { ...state.reportBeingEdited.moduleDefinition,
        subDefinitions: state.reportBeingEdited.moduleDefinition.subDefinitions.map((item, index) => {
          return (index === subDefinitionIndex) ? subDefinition : item
        })
      }
    }
  }
}

function addReportSubDefinition (state) {
  var newSubDefinitions = state.reportBeingEdited.moduleDefinition.subDefinitions.map(item => item)
  newSubDefinitions.push({ ...defaultSubDefinition })
  return { ...state,
    reportBeingEdited: { ...state.reportBeingEdited,
      moduleDefinition: { ...state.reportBeingEdited.moduleDefinition,
        subDefinitions: newSubDefinitions
      }
    }
  }
}

function removeReportSubDefinition (state, subDefinitionIndex) {
  var newSubDefinitions = state.reportBeingEdited.moduleDefinition.subDefinitions.map(item => item)
  newSubDefinitions.splice(subDefinitionIndex, 1)
  return { ...state,
    reportBeingEdited: { ...state.reportBeingEdited,
      moduleDefinition: { ...state.reportBeingEdited.moduleDefinition,
        subDefinitions: newSubDefinitions
      }
    }
  }
}

function setReportValidation (state, validation) {
  return { ...state,
    validation: validation
  }
}

function configurationReducer (state = defaultState, action) {
  switch (action.type) {
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
