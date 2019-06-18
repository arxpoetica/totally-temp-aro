import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'

export class RfpStatus extends Component {
  render () {
    return <div className='container pt-5'>
      <h2>RFP Plan Status</h2>
      <div className='row'>
        <div className='col-md-12'>
          <table className='table table-sm table-striped'>
            <thead className='thead-light'>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Created by</th>
                <th>Status</th>
                <th />
                <th />
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </div>
  }
}

RfpStatus.propTypes = {
}

const mapStateToProps = state => ({
})

const mapDispatchToProps = dispatch => ({
})

const RfpStatusComponent = wrapComponentWithProvider(reduxStore, RfpStatus, mapStateToProps, mapDispatchToProps)
export default RfpStatusComponent
