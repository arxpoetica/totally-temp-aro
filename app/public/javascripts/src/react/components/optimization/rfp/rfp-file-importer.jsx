/* globals FileReader */
import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import Point from '../../../common/point'
import './rfp-file-importer.css'
const MAX_FILE_SIZE_IN_BYTES = 1000000

export class RfpFileImporter extends Component {
  render () {
    return <div style={{ display: 'inline-block' }}>
      <label htmlFor='inpRfpFileImport' className='rfp-file-import-label btn btn-sm btn-primary'>
        <i className='fas fa-file-import' /> Import csv...
      </label>
      <input id='inpRfpFileImport' className='rfp-file-import-input' type='file' onChange={event => this.loadPointsFromFile(event)} />
    </div>
  }

  loadPointsFromFile (event) {
    const self = this
    const file = event.target.files[0]
    if (!file) {
      console.warn('No file selected')
      return
    }
    if (file.size > MAX_FILE_SIZE_IN_BYTES) {
      throw new Error(`File too large. Maximum file size for selecting targets is ${MAX_FILE_SIZE_IN_BYTES} bytes.`)
    }
    var reader = new FileReader()
    reader.onload = function (e) {
      const contents = e.target.result
      // Split by lines
      var lines = contents.split('\n')
      const firstLine = lines.splice(0, 1)[0] // The first line is assumed to be a column header, ignore it
      if (firstLine !== 'latitude, longitude') {
        throw new Error('In RfpFileImporter: The csv file format is incorrect. The first line should be "latitude, longitude"')
      }
      var targets = lines.map(line => {
        const latLng = line.split(',')
        return new Point(+latLng[0], +latLng[1])
      })
      self.props.addTargets(targets)
    }
    reader.readAsText(file)
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
