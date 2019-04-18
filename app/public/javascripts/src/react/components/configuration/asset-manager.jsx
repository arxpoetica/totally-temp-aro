import React, { Component } from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import ConfigurationActions from './configuration-actions'

export class AssetManager extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
    this.state = {
      isValidFileSelected: false
    }
    this.props.getAssetKeys(0, 500)
  }

  render () {
    return <div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className='table table-sm table-striped'>
          <thead className='thead thead-dark'>
            <tr>
              <th>Asset key</th>
              <th style={{ textAlign: 'center' }}>Image</th>
            </tr>
          </thead>
          <tbody>
            {this.props.assetKeys.map(assetKey =>
              <tr key={assetKey}>
                <td style={{ verticalAlign: 'middle' }}>{assetKey}</td>
                <td style={{ textAlign: 'center' }}>
                  <img src={`/ui_assets/${assetKey}`} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <hr />
      <h4>Upload a new file:</h4>
      <input type='file' ref={this.fileInput} onChange={event => this.setState({ isValidFileSelected: Boolean(this.fileInput.current) })} />
      <button id='btnUploadAsset' className={this.state.isValidFileSelected ? 'btn btn-primary' : 'btn btn-light'}
        disabled={!this.state.isValidFileSelected} onClick={event => this.uploadFile()}>
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
  assetKeys: PropTypes.array
}

const mapStateToProps = (state) => ({
  assetKeys: state.configuration.assetKeys
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  getAssetKeys: (offset, limit) => dispatch(ConfigurationActions.getAssetKeys(offset, limit)),
  uploadAssetToServer: (assetKey, file) => dispatch(ConfigurationActions.uploadAssetToServer(assetKey, file))
})

const AssetManagerComponent = connect(mapStateToProps, mapDispatchToProps)(AssetManager)
export default AssetManagerComponent
