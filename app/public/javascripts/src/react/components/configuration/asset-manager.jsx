import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from './configuration-actions'

export class AssetManager extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
  }

  render () {
    return <div>
      <input type='file' ref={this.fileInput} />
      <button className='btn btn-primary' onClick={event => this.uploadFile()}>
        Upload
      </button>
    </div>
  }

  uploadFile () {
    const file = this.fileInput.current.files[0]
    const assetKey = file.name
    this.props.uploadAssetToServer(assetKey, file)
  }
}

AssetManager.propTypes = {
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  uploadAssetToServer: (assetKey, file) => dispatch(ConfigurationActions.uploadAssetToServer(assetKey, file))
})

const AssetManagerComponent = wrapComponentWithProvider(reduxStore, AssetManager, mapStateToProps, mapDispatchToProps)
export default AssetManagerComponent
