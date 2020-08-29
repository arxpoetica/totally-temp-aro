import React, { Component } from 'react'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import './tool-bar.css';
import GlobalSettingsButton from '../global-settings/global-settings-button.jsx'
import ToolBarActions from './tool-bar-actions'
import uuidStore from '../../../shared-utils/uuid-store'

export class ToolBar extends Component {
  constructor (props) {
    super(props)

    this.state = {
    }
  }

  componentDidMount(){
    this.initSearchBox()
  }

  render() {
    this.initSearchBox();
    
    return(
      <div className="tool-bar" style={{margin: '10px'}}>

        <img src="images/logos/aro/logo_navbar.png" className="no-collapse" style={{alignSelf: 'center', paddingLeft: '10px', paddingRight: '10px'}}/>

        <div className="no-collapse" id="global-search-toolbutton" style={{flex: '0 0 250px', margin: 'auto', width: '250px'}}>
          <input className="form-control select2" style={{padding:'0px', borderRadius: '0px'}} type="text" placeholder="Search an address, city, or state"/>
        </div>

        <div className="fa fa-search no-collapse" style={{paddingLeft: '10px', paddingRight: '10px', margin: 'auto', color: '#eee'}}></div>

        <div className="separator no-collapse"></div>

        <GlobalSettingsButton/>

        <div className="separator"></div>

        <button className="btn"  title="Create a new plan">
          <i className="fa fa-file"></i>
        </button>

        <button className="btn" onClick={(e) => this.savePlanAs()}  title="Save plan as...">
          <i className="far fa-save"></i>
        </button>

        <button className="btn"  title="Open an existing plan...">
          <i className="fa fa-folder-open"></i>
        </button>

        <div className="separator"></div>

        <React.Fragment className="rulerDropdown">
          <button className="btn" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Ruler">
            <i className="fa fa-ruler"></i>
          </button>
        </React.Fragment>

        <React.Fragment className="myDropdown1">
          <button className="btn" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Show view settings...">
            <i className="fa fa-eye"></i>
          </button>
        </React.Fragment>

        <button className="btn"  title="Select individual locations">
          <i className="fa fa-mouse-pointer"></i>
        </button>

        <button className="btn"  title="Select multiple locations">
          <i className="fa fa-draw-polygon"></i>
        </button>

        <button className="btn"  title="Annotation">
          <i className="fa fa-paint-brush"></i>
        </button>

        <button className="btn"  title="PDF Reports">
          <i className="fas fa-print"></i>
        </button>

        <div className="separator"></div>

        <button className="btn"  title="Calculate coverage boundary">
          <i className="fa fa-crosshairs fa-rotate-180"></i>
        </button>

        <button className="btn"  title="Export selected polygon">
          <i className="fa fa-cube"></i>
        </button>

        <button className="btn"  title="Show RFP status">
          <i className="fa fa-cloud"></i>
        </button>

      </div>

    )
  }

  initSearchBox () {
    var ids = 0
    var searchSessionToken = ''
    var search = $('#global-search-toolbutton .select2')
    console.log(search)
    console.log(this.props.defaultPlanCoordinates)
    //var self = this
    search.select2({
      placeholder: 'Set an address, city, state or CLLI code',
      ajax: {
        url: '/search/addresses',
        dataType: 'json',
        quietMillis: 250, // *** In newer versions of select2, this is called 'delay'. Remember this when upgrading select2
        data: (term) => ({
          text: term,
          sessionToken: uuidStore.getInsecureV4UUID(),
          biasLatitude: this.props.defaultPlanCoordinates.latitude,
          biasLongitude: this.props.defaultPlanCoordinates.longitude
        }),
        results: (data, params) => {
          var items = data.map((location) => {
            return {
              id: 'id-' + (++ids),
              text: location.displayText,
              type: location.type,
              value: location.value
            }
          })
          if (items.length === 0) {
            items.push({
              id: 'id-' + (++ids),
              text: 'Search an address, city, or state',
              type: 'placeholder'
            })
          }
          return {
            results: items,
            pagination: {
              more: false
            }
          }
        },
        cache: true
      }
    }).on('change', (e) => {
     
    })
    //search.select2('val', location, true)
  }

  savePlanAs(){
    this.props.setPlanInputsModal(true)
  }
}

const mapStateToProps = (state) => ({
  defaultPlanCoordinates: state.plan.defaultPlanCoordinates
})  

const mapDispatchToProps = (dispatch) => ({
  setPlanInputsModal: (status) => dispatch(ToolBarActions.setPlanInputsModal(status))
})

const ToolBarComponent = wrapComponentWithProvider(reduxStore, ToolBar, mapStateToProps, mapDispatchToProps)
export default ToolBarComponent