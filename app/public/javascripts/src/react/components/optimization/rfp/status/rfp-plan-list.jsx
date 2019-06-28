import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../../../redux-store'
import wrapComponentWithProvider from '../../../../common/provider-wrapped-component'
import RfpActions from '../rfp-actions'
import RfpStatusActions from './actions'
import ReportDefinitionPropType from './report-definition-prop-type'
import RfpStatusRow from './rfp-status-row.jsx'
import RfpStatusSearch from './rfp-status-search.jsx'

export class RfpPlanList extends Component {
  render () {
    return <div style={{ overflowX: 'hidden', overflowY: 'auto' }}>
      <div className='row'>
        <div className='col-md-6' />
        <div className='col-md-6'>
          <RfpStatusSearch />
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12'>
          <table className='table table-sm table-striped'>
            <thead className='thead-light'>
              <tr style={{ textAlign: 'center' }}>
                <th>ID</th>
                <th className='text-left pl-5'>Name</th>
                <th>Created by</th>
                <th>Status</th>
                <th style={{ width: '400px' }}>Reports</th>
              </tr>
            </thead>
            <tbody>
              {
                this.props.isLoadingRfpPlans
                  ? this.renderLoadingIconRow()
                  : this.renderRfpPlanRows()
              }
            </tbody>
          </table>
          {this.renderPagination()}
        </div>
      </div>
    </div>
  }

  renderLoadingIconRow () {
    return <tr>
      <td colSpan={5} className='p-5 text-center'>
        <div className='fa fa-5x fa-spin fa-spinner mb-4' />
        <h4>Loading RFP Plans...</h4>
      </td>
    </tr>
  }

  renderRfpPlanRows () {
    const plansToRender = this.props.rfpPlans.slice(this.props.planListOffset, this.props.planListOffset + this.props.planListLimit)
    return plansToRender.map(rfpPlan => (
      <RfpStatusRow
        key={rfpPlan.id}
        planId={rfpPlan.id}
        name={rfpPlan.name}
        createdById={rfpPlan.createdBy}
        status={rfpPlan.planState}
        reportDefinitions={this.props.rfpReportDefinitions}
      />
    ))
  }

  renderPagination () {
    const numPlans = this.props.rfpPlans.length
    if (numPlans === 0) {
      return null
    }
    const activePageNumber = Math.round(this.props.planListOffset / this.props.planListLimit) + 1
    const numPages = Math.ceil(numPlans / this.props.planListLimit)
    const NUM_PAGES_TO_SHOW = 4 // Number of pages to show before/after the active page
    const startPage = Math.max(activePageNumber - NUM_PAGES_TO_SHOW, 1)
    const endPage = Math.min(activePageNumber + NUM_PAGES_TO_SHOW, numPages)
    const planListLimit = this.props.planListLimit
    const offsetOnClick = pageToLoad => (pageToLoad - 1) * planListLimit
    var pageBlocks = []
    if (activePageNumber > 1) {
      pageBlocks.push(<li key={'Previous'} className='page-item'>
        <a id='rfpPagePrev' className='page-link' href='#' onClick={event => this.props.setPlanListOffset(offsetOnClick(activePageNumber - 1))}>Prev</a>
      </li>)
    }
    for (var iPage = startPage; iPage <= endPage; ++iPage) {
      const liClassName = 'page-item' + (iPage === activePageNumber ? ' active' : '')
      const copyIPage = iPage
      pageBlocks.push(<li key={iPage} className={liClassName}>
        <a id={`rfpPage_${iPage}`} className='page-link' href='#' onClick={event => this.props.setPlanListOffset(offsetOnClick(copyIPage))}>{iPage}</a>
      </li>)
    }
    if (activePageNumber !== numPages) {
      pageBlocks.push(<li key={'Next'} className='page-item'>
        <a id='rfpPageNext' className='page-link' href='#' onClick={event => this.props.setPlanListOffset(offsetOnClick(activePageNumber + 1))}>Next</a>
      </li>)
    }
    return <nav aria-label='RFP plan pagination'>
      <ul className='pagination justify-content-center'>
        {pageBlocks}
      </ul>
    </nav>
  }

  componentDidMount () {
    this.props.loadRfpPlans(this.props.userId)
  }

  componentWillUnmount () {
    this.props.clearRfpPlans()
  }
}

RfpPlanList.propTypes = {
  rfpPlans: PropTypes.array,
  rfpReportDefinitions: ReportDefinitionPropType,
  isLoadingRfpPlans: PropTypes.bool,
  planListOffset: PropTypes.number,
  planListLimit: PropTypes.number,
  userId: PropTypes.number
}

const mapStateToProps = state => ({
  rfpPlans: state.optimization.rfp.rfpPlans,
  rfpReportDefinitions: state.optimization.rfp.rfpReportDefinitions,
  isLoadingRfpPlans: state.optimization.rfp.isLoadingRfpPlans,
  planListOffset: state.optimization.rfp.planListOffset,
  planListLimit: state.optimization.rfp.planListLimit,
  userId: state.user.loggedInUser && state.user.loggedInUser.id
})

const mapDispatchToProps = dispatch => ({
  clearRfpPlans: () => dispatch(RfpStatusActions.clearRfpPlans()),
  loadRfpPlans: (userId) => dispatch(RfpActions.loadRfpPlans(userId)),
  setPlanListOffset: planListOffset => dispatch(RfpStatusActions.setPlanListOffset(planListOffset))
})

const RfpPlanListComponent = wrapComponentWithProvider(reduxStore, RfpPlanList, mapStateToProps, mapDispatchToProps)
export default RfpPlanListComponent
