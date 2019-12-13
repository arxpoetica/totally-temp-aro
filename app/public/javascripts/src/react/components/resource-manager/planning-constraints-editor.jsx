import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import PlanningConstraints from './planning-constraints-form.jsx'

export class PlanningConstraintsEditor extends Component {
  render () {
    return <div>
      <h4>{this.props.name}</h4>
      <PlanningConstraints initialValues={this.props.definition} enableReinitialize />
    </div>
  }
}

PlanningConstraintsEditor.propTypes = {
}

const mapStateToProps = state => ({
  name: state.resourceManager.managers[state.resourceManager.editingManager.id].name,
  definition: state.resourceManager.managers[state.resourceManager.editingManager.id].definition
})

const mapDispatchToProps = dispatch => ({
})

const PlanningConstraintsEditorComponent = wrapComponentWithProvider(reduxStore, PlanningConstraintsEditor, mapStateToProps, mapDispatchToProps)
export default PlanningConstraintsEditorComponent
