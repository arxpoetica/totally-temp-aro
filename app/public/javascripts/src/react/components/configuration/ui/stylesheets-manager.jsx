import React, { Component } from 'react'
import reduxStore from '../../../../redux-store'
import wrapComponentWithProvider from '../../../common/provider-wrapped-component'
import UiActions from './ui-actions'

export class StylesheetManager extends Component {
  constructor (props) {
    super(props)
    this.state = {
      StyleValues: props.initialConfiguration
    }
  }
  

  render () {
    return <div id='divStylesheetForm'>
     <form>
        <div className='form-group row'>
          {/* The value of the selected configuration type */}
          <label className='col-sm-4 col-form-label'>Value</label>
          <div className='col-sm-8'>
            <textarea className='form-control'
              style={{ height: '350px' }}
              value={this.state.StyleValues}
              onChange={event => this.handleChanges(event.target.value)} />
          </div>
        </div>
        {/* Show an error message if we have one */}
        {
          this.state.errorMessage
            ? <div className='alert alert-danger'>{this.state.errorMessage}</div>
            : null
        }
      </form>
      <button className='btn btn-primary float-right' onClick={() => this.saveStylesheettoServer()}>
        <i className='fa fa-save' />Save settings
      </button>
    </div>
  }
  handleChanges (newValue) {
    this.setState({
      StyleValues:  newValue
    })
  }
  saveStylesheettoServer () {
    if(!this.state.StyleValues){
      this.setState({
               errorMessage: `Please Update some CSS values!!`
             })
    }else{
      this.props.saveStylesheetsToServerAndReload(this.state.StyleValues)
    }
  }
}

StylesheetManager.propTypes = {}
const mapStateToProps = (state) => ({
  initialConfiguration: state.configuration.ui.styleValues
})



const mapDispatchToProps = (dispatch, ownProps) => ({
  saveStylesheetsToServerAndReload: (StyleValues) => dispatch(UiActions.saveStylesheetsToServerAndReload(StyleValues))
})

const ConfigurationEditorComponent = wrapComponentWithProvider(reduxStore, StylesheetManager, mapStateToProps, mapDispatchToProps)
export default ConfigurationEditorComponent
