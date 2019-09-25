import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import { PropTypes } from 'prop-types'

export class PermissionsTable extends Component {
  constructor (props) {
    super(props)
    
  }

  render () {
    console.log(this.props)
    return <div>{this.props.resource.name}</div>
  }



}

// --- //

PermissionsTable.propTypes = {
  /*
  rings: PropTypes.objectOf(PropTypes.instanceOf(Ring)),
  selectedRingId: PropTypes.number,
  plan: PropTypes.object,
  user: PropTypes.object,
  map: PropTypes.object
  */
}

const mapStateToProps = (state) => ({
  /*
  dataItems: state.plan.dataItems,
  uploadDataSources: state.plan.uploadDataSources,
  systemActors: state.user.systemActors
  */
})

const mapDispatchToProps = dispatch => ({
  /*
  selectDataItems: (dataItemKey, selectedLibraryItems) => dispatch(PlanActions.selectDataItems(dataItemKey, selectedLibraryItems)),
  setAllLibraryItems: (dataItemKey, allLibraryItems) => dispatch(PlanActions.setAllLibraryItems(dataItemKey, allLibraryItems))
  */
})

const PermissionsTableComponent = wrapComponentWithProvider(reduxStore, PermissionsTable, mapStateToProps, mapDispatchToProps)
export default PermissionsTableComponent