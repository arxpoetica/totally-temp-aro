import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class PlanningConstraintsEditor extends Component {
  render () {
    return <div>
      <table id="tblPlanningConstraints" class="table table-sm table-striped">
        
      </table>
    </div>
  }
}

PlanningConstraintsEditor.propTypes = {
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
})

const PlanningConstraintsEditorComponent = wrapComponentWithProvider(reduxStore, PlanningConstraintsEditor, mapStateToProps, mapDispatchToProps)
export default PlanningConstraintsEditorComponent
