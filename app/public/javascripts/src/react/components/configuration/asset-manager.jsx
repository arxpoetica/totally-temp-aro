import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import AroHttp from '../../common/aro-http'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import ConfigurationActions from './configuration-actions'

export class AssetManager extends Component {
  constructor (props) {
    super(props)
    this.fileInput = React.createRef()
    this.state = {
      assetKeys: [],
      isValidFileSelected: false
    }
    AroHttp.get('/ui_assets/list/assetKeys?limit=500')
      .then(result => {
        this.setState({
          assetKeys: result.data
        })
      })
      .catch(err => console.error(err))
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
            {this.state.assetKeys.map(assetKey =>
              <tr key={assetKey}>
                <td style={{ verticalAlign: 'middle' }}>{assetKey}</td>
                <td style={{ textAlign: 'center' }}><img src={`/ui_assets/${assetKey}`} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <hr />
      <h4>Upload a new file:</h4>
      <input type='file' ref={this.fileInput} onChange={event => this.setState({ isValidFileSelected: Boolean(this.fileInput.current) })} />
      <button className='btn btn-primary' disabled={!this.state.isValidFileSelected} onClick={event => this.uploadFile()}>
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
