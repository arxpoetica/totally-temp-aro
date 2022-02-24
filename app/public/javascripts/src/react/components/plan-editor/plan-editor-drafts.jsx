import React from 'react'
import { connect } from 'react-redux'
import Boundary from './map-objects/boundary.jsx'
import EquipmentNode from './map-objects/equipment-node.jsx'

const PlanEditorDrafts = props => {

  const { drafts } = props

  // FIXME: optimize this...
  return Object.values(drafts).map(draft =>
    <React.Fragment key={draft.subnetId}>
      <Boundary id={draft.subnetId} polygon={draft.boundary.polygon} />
      {draft.equipment.map(node =>
        <EquipmentNode key={node.id} id={node.id} node={node} />
      )}
    </React.Fragment>
  )
}

const mapStateToProps = state => ({
  drafts: state.planEditor.drafts,
})
const mapDispatchToProps = dispatch => ({})
export default connect(mapStateToProps, mapDispatchToProps)(PlanEditorDrafts)
