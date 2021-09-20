import React, { Component } from 'react'
import AroFeatureFactory from '../../../../service-typegen/dist/AroFeatureFactory'
import Foldout from '../foldout.jsx'
import AroFeatureEditorNode from './aro-feature-editor-node.jsx'

export class AroFeatureEditor extends Component {
  constructor (props) {
    super(props)

    this.isCollapsible = true
    this.isEditable = true
    if ('isCollapsible' in props) this.isCollapsible = this.props.isCollapsible
    if ('isEditable' in props) this.isEditable = this.props.isEditable

    //  this gets a serializable value as prop and NO meta
    //  then THIS COMPONENT does the AroFeatureFactory.createObject(this.props.value)
    //  AND makes the meta from the return
    //  this has the added benifits of:
    //    - we can parse the meta into any schema we want
    //    - we have a serializable object for form value to allow cloning
    //    - when we refactor AroFeatureFactory it's contained here and decoupled from the reast of the codebase
    let aroFeature = AroFeatureFactory.createObject(this.props.feature)
    let meta = aroFeature.getFullDisplayProperties()
    // TODO: get enums in the meta

    aroFeature = aroFeature.networkNodeEquipment
    meta = meta.networkNodeEquipment

    this.state = {
      value: JSON.parse(JSON.stringify(aroFeature)),
      meta: meta,
      canSave: false,
    }
  }

  render () {
    let displayName = this.props.altTitle || this.state.meta.displayName
    return (
      <Foldout displayName={displayName}>
        <AroFeatureEditorNode
          objPath=""
          omitRootContain={true}
          isCollapsible={this.isCollapsible}
          isEditable={this.isEditable}
          value={this.state.value} // this.state.value
          meta={this.state.meta}
          onChange={(event, propVal, path) => this._onChange(event, propVal, path)}
        ></AroFeatureEditorNode>
        <button className="btn btn-light"
          style={{margin: '30px 12px 12px 0px'}}
          onClick={event => this._onSave(event)}
          disabled={!this.state.canSave}
        >Save</button>
      </Foldout>
    )
  }

  _onChange (event, propVal, path) {
    // can do validate here and change meta with validation message 

    let parsedPath = path
    // normalize notation for array indices
    parsedPath = parsedPath.replace('].', '.')
    parsedPath = parsedPath.replace('[', '.')
    parsedPath = parsedPath.replace(']', '')
    let pathAr = parsedPath.split('.')
    pathAr.shift()
    let leafKey = pathAr.pop()
    
    // So .reduce steps through an array calling a function and keeping a running tally (collector, value) 
    //  we step through the object path using the collector to keep the object reference.
    //  We provide valClone as the initial value for ref, then step down through that object
    //  if we get to an undefined key we make it an empty object. 
    //  (This shouldn't happen in our usage but is good for a more general case.)
    //  we know everythig upto the leaf node will be either an object or an array so will be a reference.
    //  The leaf node will often be a primitave so we stop just short. 
    //  Then set the ref to the val, save to state, and Bob's yer uncle.
    let valueClone = JSON.parse(JSON.stringify(this.state.value))
    let stateRef = pathAr.reduce((ref, key) => (ref || {})[key], valueClone)
    stateRef[leafKey] = propVal
    
    this.setState({
      'value': valueClone,
      'canSave': true,
    })

    this.props.onChange(valueClone, propVal, path, event)
  }

  _onSave (event) {
    if (this.props.onSave) this.props.onSave(this.state.value)
  }
}

export default AroFeatureEditor
