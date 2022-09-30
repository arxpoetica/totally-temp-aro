import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Select } from '@mantine/core'
import ExpertModeActions from './expert-mode-actions'

export class AnalysisExpertMode extends Component {
  constructor (props) {
    super(props)

    this.props.getExpertModeScopeContext(this.props.plan)

    this.state = {
      expertMode: this.props.expertMode,
    }
  }

  render () {

    const { expertModeTypes, scopeContextKeys, selectedExpertMode } = this.props
    const { expertMode } = this.state

    return (
      <div className="expert-mode">
        <Select
          value={selectedExpertMode}
          onChange={value => this.handleExpertModeTypesChange(value)}
          data={Object.values(expertModeTypes).map(item => {
            return { value: item.id, label: item.label }
          })}
        />
        <textarea
          rows="17"
          maxLength="75000"
          style={{ fontFamily: 'Courier', width: '100%', height: '100%' }}
          value={expertMode[selectedExpertMode]}
          placeholder={`Available Keys: ${JSON.stringify(scopeContextKeys)}`}
          onChange={(event) => this.validateExpertModeQuery(event)}
          spellCheck="false"
        />
        <style jsx>{`
          .expert-mode {
            width: 100%;
          }
          textarea {
            margin: 10px 0 0;
          }
        `}</style>
      </div>
    )
  }

  validateExpertModeQuery(event) {
    const expertMode = this.state.expertMode;
    const selectedExpertMode = this.props.selectedExpertMode

    expertMode[selectedExpertMode] = event.target.value
    this.setState({ expertMode })
    this.props.setExpertMode(JSON.parse(JSON.stringify(expertMode)))

    let hasExcludeTerm = false
    const excludeTerms = ['delete', 'drop', 'update', 'alter', 'insert', 'call', 'commit', 'create']
    excludeTerms.forEach((term) => {
      if (this.state.expertMode[selectedExpertMode].toLowerCase().indexOf(term) > -1) hasExcludeTerm = true
    })

    const expertModeTypes = this.props.expertModeTypes
    expertModeTypes[selectedExpertMode].isQueryValid = this.state.expertMode[selectedExpertMode].toLowerCase().indexOf('select') > -1 && !hasExcludeTerm
    this.props.setExpertModeTypes(JSON.parse(JSON.stringify(expertModeTypes)))
  }

  handleExpertModeTypesChange(value) {
    this.props.setSelectedExpertMode(value)
  }
}

const mapStateToProps = (state) => ({
  expertModeTypes: state.expertMode.expertModeTypes,
  selectedExpertMode: state.expertMode.selectedExpertMode,
  plan: state.plan.activePlan,
  scopeContextKeys: state.expertMode.scopeContextKeys,
  expertMode: state.expertMode.expertMode,
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedExpertMode: (selectedExpertMode) => dispatch(ExpertModeActions.setSelectedExpertMode(selectedExpertMode)),
  getExpertModeScopeContext: (plan) => dispatch(ExpertModeActions.getExpertModeScopeContext(plan)),
  setExpertMode: (expertMode) => dispatch(ExpertModeActions.setExpertMode(expertMode)),
  setExpertModeTypes: (expertModeTypes) => dispatch(ExpertModeActions.setExpertModeTypes(expertModeTypes)),
})

const AnalysisExpertModeComponent = connect(mapStateToProps, mapDispatchToProps)(AnalysisExpertMode)
export default AnalysisExpertModeComponent
