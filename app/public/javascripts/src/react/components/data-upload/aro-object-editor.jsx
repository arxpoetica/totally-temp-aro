import React, { Component } from 'react'
import { connect } from 'react-redux'

const constTileSystemParams = {
  conicSystem: {
    code: 'EPSG:5070',
    srid: 5070
  },
  cellSize: 30,
  systemOriginX: '-96.0009191593717',
  systemOriginY: '23.0002109131773',
  tileWidth: 300
}

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
                        onTileSystemChange={this.props.onTileSystemChange}
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
    let tileSystemData = constTileSystemParams;

    if(e.target.name === 'code' ){
      tileSystemData['conicSystem'] = {"code" : e.target.value, "srid" : tileSystemData['conicSystem'].srid}
    } else if(e.target.name === 'srid' ){
      tileSystemData['conicSystem'] = {"code" : tileSystemData['conicSystem'].code, "srid" : e.target.value}
    } else {
      tileSystemData[e.target.name] = e.target.value
    }
    this.props.onTileSystemChange(tileSystemData)
  }

  isEditable (obj) {
    return (typeof obj === 'number') || (typeof obj === 'string') || (typeof obj === 'boolean') || Array.isArray(obj)
  }

  // check that has at least one property
  isExpandable (obj) {
    return !!obj && obj.constructor === Object && Object.keys(obj).length
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