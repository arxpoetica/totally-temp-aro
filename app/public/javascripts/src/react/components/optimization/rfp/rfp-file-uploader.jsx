/* globals FileReader */
import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import RfpActions from './rfp-actions'
import Point from '../../../common/point'
const MAX_FILE_SIZE_IN_BYTES = 1000000

export class RfpFileUpload extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fileInputRefs: []
    }
  }

  render () {
    return <div>
      <div
        style={{ width: '100%', height: '100px' }}
        onDrop={event => this.handleFileDrop(event)}
        onDragOver={event => this.handleDragOver(event)}
      >
        hello
      </div>
      <label>Upload lat/longs from a file:</label>
      <input className='form-control' type='file' onChange={event => this.loadPointsFromFile(event)} />
      {
        this.state.fileInputRefs.map((fileInputRef, index) => (
          <div key={index}>
            <div>{index} - has {fileInputRef.current ? fileInputRef.current.files.length : 'undefined'} files</div>
            <input id={`inpRfpUpload_${index}`} type='file' ref={fileInputRef} onChange={event => this.onFileChanged(event)} />
            <button className='btn btn-light' onClick={event => this.removeFileUpload(index)}>Remove</button>
          </div>
        ))
      }
      <button className='btn btn-light' onClick={event => this.addFileUpload()}>Add</button>
    </div>
  }

  addFileUpload () {
    this.setState({
      fileInputRefs: this.state.fileInputRefs.concat([React.createRef()])
    })
  }

  removeFileUpload (index) {
    var newFileInputRefs = [].concat(this.state.fileInputRefs)
    newFileInputRefs.splice(index, 1)
    this.setState({
      fileInputRefs: newFileInputRefs
    })
  }

  onFileChanged (event) {
    console.log(event)
    console.log(event.target.files)
    const file = event.target.files[0]
    var reader = new FileReader()
    reader.onload = function (e) {
      var contents = e.target.result
      console.log(contents)
    }
    reader.readAsText(file)
  }

  handleFileDrop (event) {
    event.preventDefault()
    console.log(event)
    if (event.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < event.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (event.dataTransfer.items[i].kind === 'file') {
          var file = event.dataTransfer.items[i].getAsFile()
          console.log('... file1[' + i + '].name = ' + file.name)
          console.log(file)
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (i = 0; i < event.dataTransfer.files.length; i++) {
        console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name)
        console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i])
      }
    }
  }

  handleDragOver (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  loadPointsFromFile (event) {
    const self = this
    const file = event.target.files[0]
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
        return new Point(latLng[0], latLng[1])
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
