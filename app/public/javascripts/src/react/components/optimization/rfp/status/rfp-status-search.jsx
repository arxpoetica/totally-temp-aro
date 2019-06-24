import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import RfpActions from '../rfp-actions'

export class RfpStatusSearch extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTerm: ''
    }
  }

  render () {
    return <div className='input-group mb-3'>
      <input
        id='txtRfpPlanSearch'
        type='text'
        className='form-control'
        placeholder='Enter search term...'
        aria-label='Enter search term"'
        value={this.state.searchTerm}
        onChange={event => this.onSearchTermChanged(event.target.value)}
        onKeyPress={event => this.onSearchKeyPress(event)}
        disabled={this.props.isLoadingRfpPlans}
      />
      <div className='input-group-append'>
        <button
          id='btnRfpPlanSearch'
          className='btn btn-primary'
          onClick={event => this.doSearch()}
          disabled={this.props.isLoadingRfpPlans}
        >
          <i className='fa fa-search' /> Search
        </button>
      </div>
    </div>
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

RfpStatusSearch.propTypes = {
  isLoadingRfpPlans: PropTypes.bool,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  isLoadingRfpPlans: state.optimization.rfp.isLoadingRfpPlans,
  userId: state.user.loggedInUser && state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  loadRfpPlans: (userId, searchTerm) => dispatch(RfpActions.loadRfpPlans(userId, searchTerm))
})

const RfpStatusSearchComponent = connect(mapStateToProps, mapDispatchToProps)(RfpStatusSearch)
export default RfpStatusSearchComponent
