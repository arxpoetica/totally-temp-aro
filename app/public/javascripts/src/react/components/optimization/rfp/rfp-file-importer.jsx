import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import RfpPointImporterUtils from './rfp-file-importer-utils'
import './rfp-file-importer.css'

export class RfpFileImporter extends Component {
  render () {
    return <div style={{ display: 'inline-block' }}>
      <label htmlFor='inpRfpFileImport' disabled={this.props.displayOnly} className='rfp-file-import-label btn btn-sm btn-light'>
        <i className='fas fa-file-import' /> Import csv...
      </label>
      <input id='inpRfpFileImport' className='rfp-file-import-input' type='file' disabled={this.props.displayOnly} onChange={event => this.loadPointsFromFile(event)} />
    </div>
  }

  loadPointsFromFile (event) {
    const file = event.target.files[0]
    RfpPointImporterUtils.loadPointsFromFile(file)
      .then(targets => this.props.addTargets(targets))
      .catch(err => console.error(err))
  }
}

RfpFileImporter.propTypes = {
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = dispatch => ({
  addTargets: targets => dispatch(RfpActions.addTargets(targets))
})

const RfpFileImporterComponent = wrapComponentWithProvider(reduxStore, RfpFileImporter, mapStateToProps, mapDispatchToProps)
export default RfpFileImporterComponent
