import React, { Component } from 'react'
import AroFeatureFactory from '../../../../service-typegen/dist/AroFeatureFactory'
import AroFeatureEditorNode from './aro-feature-editor-node.jsx'

export class AroFeatureEditor extends Component {
  constructor (props) {
    super(props)

    if (!'isCollapsible' in props) props.isCollapsible = true
    if (!'isEditable' in props) props.isEditable = true
    if (!'visible' in props.meta) props.meta.visible = true

    this.state = {
      'value': this.props.value, // may need to update this on props change
    }
  }

  render () {
    return (
      <AroFeatureEditorNode 
        objPath='' 
        isCollapsible={this.props.isCollapsible}
        isEditable={this.props.isEditable} 
        value={this.state.value} 
        meta={this.props.meta} 
        onChange={(event, propVal, path) => this._onChange(event, propVal, path)}
      ></AroFeatureEditorNode>
    )
  }

  _onChange (event, propVal, path) {
    let pathAr = path.split('.')
    pathAr.shift()
    let leafKey = pathAr.pop()
    // will omit functions
    let pathClone = {...this.state.value}
    // So .reduce steps through an array calling a function and keeping a running tally (collector, value) 
    //  we step through the object path using the collector to keep the object reference.
    //  We provide valClone as the initial value for ref, then step down through that object
    //  if we get to an undefined key we make it an empty object. 
    //  This shouldn't happen in our usage but is good for a more general case.
    //  we know everythig upto the leaf node will be either an object or an array so will be a reference.
    //  The leaf node will often be a primitave so we stop just short. 
    //  We want the object refernce not a value like '10'.
    //  We then merge the JSONified clone back into the state value object 
    //  thus preserving any functions on the state value object
    //let objRef = pathAr.reduce((ref, key) => (ref || {})[key], pathClone)
    /*
    let objRef = pathAr.reduce((ref, key) => {
      ref[key] = {...ref[key]}  
      return (ref[key])
    }, pathClone)
    objRef[leafKey] = propVal // changeing valClone by refernce
    console.log(pathClone)
    console.log(this.state.value)
    */
    // can do validate here and chnge meta with validation message 
    
    // ToDo: we are probably going to need to fix this <-----------------------------------------<<<
    let stateRef = pathAr.reduce((ref, key) => (ref || {})[key], this.state.value)
    stateRef[leafKey] = propVal
    console.log(this.state.value)
    
    //let newValObj = {...this.state.value, ...pathClone}
    //console.log(newValObj)
    //console.log(pathClone.getDisplayProperties())
    
    this.setState({
      'value': this.state.value,
    })

    //this.props.onChange(newValObj, propVal, path, event)
  }  
}

export default AroFeatureEditor
