/* globals FileReader */
import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import Point from '../../../common/point'
import './rfp-file-uploader.css'
const MAX_FILE_SIZE_IN_BYTES = 1000000

export class RfpFileUpload extends Component {
  render () {
    return <div style={{ display: 'inline-block' }}>
      <label htmlFor='inpRfpFileUpload' className='rfp-file-upload-label btn btn-sm btn-primary'>
        <i className='fas fa-file-import' /> Import csv...
      </label>
      <input id='inpRfpFileUpload' className='rfp-file-upload-input' type='file' onChange={event => this.loadPointsFromFile(event)} />
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
        throw new Error('In RfpFileUploader: The csv file format is incorrect. The first line should be "latitude, longitude"')
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

RfpFileUpload.propTypes = {
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = dispatch => ({
  addTargets: targets => dispatch(RfpActions.addTargets(targets))
})

const RfpFileUploadComponent = wrapComponentWithProvider(reduxStore, RfpFileUpload, mapStateToProps, mapDispatchToProps)
export default RfpFileUploadComponent
