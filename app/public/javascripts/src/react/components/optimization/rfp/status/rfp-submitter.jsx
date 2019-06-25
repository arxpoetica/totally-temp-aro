import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
// import RfpActions from '../rfp-actions'

export class RfpSubmitter extends Component {
  render () {
    return <div>Test</div>
  }

  onSearchTermChanged (newSearchTerm) {
    this.setState({
      searchTerm: newSearchTerm
    })
  }

  onSearchKeyPress (event) {
    if (event.key === 'Enter') {
      this.doSearch()
    }
  }

  doSearch () {
    this.props.loadRfpPlans(this.props.userId, this.state.searchTerm)
  }
}

RfpSubmitter.propTypes = {
  isLoadingRfpPlans: PropTypes.bool,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
})

const RfpSubmitterComponent = connect(mapStateToProps, mapDispatchToProps)(RfpSubmitter)
export default RfpSubmitterComponent
