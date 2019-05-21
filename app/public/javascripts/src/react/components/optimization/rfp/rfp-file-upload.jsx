import React, { Component } from 'react'
// import { PropTypes } from 'prop-types'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'

export class RfpFileUpload extends Component {
  render () {
    return <div
      style={{ width: '100%', height: '100px' }}
      onDrop={event => this.handleFileDrop(event)}
      onDragOver={event => this.handleDragOver(event)}
    >
      hello
    </div>
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
}

RfpFileUpload.propTypes = {
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = dispatch => ({
})

const RfpFileUploadComponent = wrapComponentWithProvider(reduxStore, RfpFileUpload, mapStateToProps, mapDispatchToProps)
export default RfpFileUploadComponent
