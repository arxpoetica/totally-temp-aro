import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import AnnotationList from '../map-layers/annotation-list.jsx'
import MapReportsDownloader from '../map-reports/map-reports-downloader.jsx'
import Tools from './tools'

export class ToolBox extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isExpanded: true
    }
  }

  render () {
    // Position component so that it appears just below the toolbar.
    return <div className='card' style={ { position: 'absolute', top: '47px', left: '80px', width: '320px'} }>
      {/* A header on the toolbox. Clicking it will collapse/expand the toolbox. */}
      <div
        className='card-header map-tools-card-header bg-light text-dark p-1'
        style={{ cursor: 'pointer' }}
        onClick={() => this.setState({isExpanded: !this.state.isExpanded})}
      >
        {/* Title text and icon for the toolbox */}
        <span
          style={ { fontSize: '12px' }}
        >
          Toolbox: {Tools[this.props.activeTool] && Tools[this.props.activeTool].displayName }
        </span>
        <i
          className={'float-right ' + (this.state.isExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down')}
          style={{ lineHeight: '20px'}}
        />
      </div>
      {/* The card body that will hold the actual tool */}
      <div className='card-body p-2' style={{ fontSize: '12px', display: this.state.isExpanded ? 'block' : 'none', maxHeight: '400px', overflowY: 'auto' }}>
        { this.renderTool() }
      </div>
    </div>
  }

  renderTool () {
    switch (this.props.activeTool) {
      case Tools.ANNOTATION.id:
        return <AnnotationList />
      
      case Tools.MAP_REPORTS.id:
        return <MapReportsDownloader />

      default:
        return null
    }
  }
}

ToolBox.propTypes = {
  activeTool: PropTypes.string
}

const mapStateToProps = state => ({
  activeTool: state.tool.activeTool
})

const mapDispatchToProps = (dispatch) => ({
})

const ToolBoxComponent = wrapComponentWithProvider(reduxStore, ToolBox, mapStateToProps, mapDispatchToProps)
export default ToolBoxComponent
