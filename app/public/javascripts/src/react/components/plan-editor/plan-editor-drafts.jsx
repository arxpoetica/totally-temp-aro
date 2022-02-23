import React from 'react'
import { connect } from 'react-redux'
import Boundary from './map-objects/boundary.jsx'

const PlanEditorDrafts = props => {

  const { drafts } = props

  // FIXME: optimize this...
  return Object.values(drafts).map(draft =>
    <Boundary
      key={draft.subnetId}
      polygon={draft.boundary.polygon}
    />
  )
}

const mapStateToProps = state => ({
  drafts: state.planEditor.drafts,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorDrafts)
