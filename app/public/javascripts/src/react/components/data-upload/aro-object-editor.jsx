import React, { Component } from 'react'
import { connect } from 'react-redux'

export class AroObjectEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      'isKeyExpanded' : null,
      pixelsPerIndentationLevel : 20,
      indentationLevel : 0,
      tileSystemParams : null
    }
  }

  render () {
    return <>{this.renderAroObjectEditor()}</>
  }

  componentDidMount(){
    let tileSystemParams = this.props.objectToEdit
    this.setState({tileSystemParams : tileSystemParams})
  }

  renderAroObjectEditor()  {
    return (
       <>
          {/* <!-- The top level div, this contains all the child items (key-value pairs) for the object to be edited --> */}
          <div className="ei-gen-level" style={{paddingLeft : this.state.pixelsPerIndentationLevel + 'px'}}>
          {	
            Object.entries(this.props.objectToEdit).map(([ objKey, objValue ], objIndex) => {
              return (
              <div className="ei-items-contain" key={objKey}>
                {/* <!-- Loop through all the key-value pairs in the object to be edited --> */}
                {/* <!-- If this key-value pair is expandable, that means it is an object containing its own key-value pairs. 
                    RECURSIVELY show the object editor for the sub-object --> */}

                {this.isExpandable(objValue) &&
                  <div className="ei-foldout" style={{width: '100%'}}> 
                    <div className="ei-header" onClick={() => this.toggleIsKeyExpanded(objIndex)}>
                      {
                        this.state.isKeyExpanded === objIndex
                        ? <i className="far fa-minus-square ei-foldout-icon"></i>
                        : <i className="far fa-plus-square ei-foldout-icon"></i>
                      }
                      {objKey}
                    </div>
                    {this.state.indentationLevel <= 200 &&
                      <div className="ei-internal-gen" style={{ display: this.state.isKeyExpanded === objIndex ? 'inline' : 'none'}}>
                      <AroObjectEditor 
                        objectToEdit={objValue}
                        indentationLevel = {this.state.indentationLevel + 1 }
                      />
                      </div>
                    }
                  </div>
                } 

                {/* <!-- If this key-value pair is NOT expandable and has an editable value, show an input box to edit it --> */}
                {!this.isExpandable(objValue) && this.isEditable(objValue) &&
                <div className="ei-property-item">
                  <div style={{flex: '1 1 auto'}}>{objKey}</div>
                  {/* <!-- Note that our ng-model is "$ctrl.objectToEdit[key]" and not "value" so the two way binding updates the actual object --> */}
                  {this.isEditable(objValue) &&
                    <input type="text" name={objKey} className="form-control input-sm" defaultValue={this.props.objectToEdit[objKey]}  onChange={(e)=>this.handleTileSystemParams(e)} style={{flex: '0 0 100px'}} />
                  }
                </div>
                }
              </div>
            )
            })
          }
          </div>
      </>
    )
  }

  handleTileSystemParams(e){
    let tileSystemData  = this.props.objectToEdit
    tileSystemData[e.target.name] = e.target.value
    this.props.onTileSystemChange(tileSystemData)
  }

  isEditable (obj) {
    return (typeof obj === 'number') || (typeof obj === 'string') || (typeof obj === 'boolean') || Array.isArray(obj)
  }

  isExpandable (obj) {
    return (typeof obj === 'object' && {} !== obj)// && object isn't empty, ToDo: check that at least one child it showable
  }

  toggleIsKeyExpanded (objIndex) {
    if (this.state.isKeyExpanded === objIndex) {
      objIndex = null
    }

    this.setState({ ...this.state, 'isKeyExpanded': objIndex })
  }
}

  const mapStateToProps = (state) => ({
  })   

  const mapDispatchToProps = (dispatch) => ({
   
  })

const AroObjectEditorComponent = connect(mapStateToProps, mapDispatchToProps)(AroObjectEditor)
export default AroObjectEditorComponent