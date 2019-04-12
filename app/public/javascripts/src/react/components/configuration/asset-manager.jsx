import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'

export class AssetManager extends Component {
  render () {
    return <div>Hello world
    </div>
  }
}

AssetManager.propTypes = {
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = (dispatch, ownProps) => ({
})

const AssetManagerComponent = wrapComponentWithProvider(reduxStore, AssetManager, mapStateToProps, mapDispatchToProps)
export default AssetManagerComponent
