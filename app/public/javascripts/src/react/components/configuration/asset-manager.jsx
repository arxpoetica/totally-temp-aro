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
      assetKeys: []
    }
    AroHttp.get('/ui_assets/list/assetKeys')
      .then(result => {
        this.setState({
          assetKeys: result.data
        })
      })
      .catch(err => console.error(err))
  }

  render () {
    return <div>
      <input type='file' ref={this.fileInput} />
      <button className='btn btn-primary' onClick={event => this.uploadFile()}>
        Upload
      </button>
      <div style={{ backgroundColor: '#ddd' }} className='container'>
        <div className='row'>
          {this.state.assetKeys.map(assetKey =>
            <div className='col-md-3'>
              <div className='card'>
                <img src={`/ui_assets/${assetKey}`} className='card-img-top' />
                {assetKey}
              </div>
            </div>
          )}
        </div>
      </div>
      <ul>
        {this.state.assetKeys.map(assetKey => <li><img src={`/ui_assets/${assetKey}`} /></li>)}
      </ul>
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
