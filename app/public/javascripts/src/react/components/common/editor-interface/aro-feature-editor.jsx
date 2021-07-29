import React, { Component } from 'react'
import AroFeatureFactory from '../../../../service-typegen/dist/AroFeatureFactory'
import AroFeatureEditorNode from './aro-feature-editor-node.jsx'

export class AroFeatureEditor extends Component {
  constructor (props) {
    super(props)

    this.aroFeature = AroFeatureFactory.createObject(this.props.feature)
    this.meta = this.aroFeature.getDisplayProperties()

    let fullMeta = this.aroFeature.getFullDisplayProperties()
    console.log(fullMeta)


    //console.log({meta: this.meta, aroFeature: this.aroFeature})
    this.meta = this.meta.find(ele => ele.displayName === "Network Node Equipment") // ToDo: this needs fixing
    this.aroFeature = this.aroFeature.networkNodeEquipment
    //console.log(this.aroFeature.plannedEquipment[0].getDisplayProperties())
    //console.log({meta: this.meta, aroFeature: this.aroFeature})
    //console.log(this.props.feature)
    if (!'isCollapsible' in props) props.isCollapsible = true
    if (!'isEditable' in props) props.isEditable = true
    if (!'visible' in this.meta) this.meta.visible = true

    // TODO: get serializable value as prop and NO meta
    //  then THIS COMPONENT does the AroFeatureFactory.createObject(this.props.value)
    //  AND makes the meta from the return
    //  with the added benifits of:
    //    - we can parse the meta into any schema we want
    //    - we have a serializable object for form value to allow cloning
    //    - when we refactor AroFeatureFactory it's contained here and decoupled from the reast of the codebase
    this.state = {
      //'value': this.props.feature, // may need to update this on props change
      //value: JSON.parse(JSON.stringify(this.aroFeature))
      value: this.aroFeature,
    }
  }


/*
  getFullMeta (aroFeature) {
    let metaList = aroFeature.getDisplayProperties()
    console.log(metaList)
    // make it a dictionary and add special props for objects and arrays
    //  that will contain the meta for object properties and list elements
    //  note that list elements should have the same type and thus the same meta (hopefully)
    //properties = {} // used only for displayType: COLLECTION
    //itemSchema = null // used only for displayType: LIST
    let meta = {}
    metaList.forEach(metaItem => {
      let propName = metaItem.propertyName
      meta[propName] = metaItem
      // for standardisation 
      meta[propName].properties = {} // used only for displayType: COLLECTION
      meta[propName].itemSchema = null // used only for displayType: LIST
      if (metaItem.displayDataType.startsWith('object')) {
        meta[metaItem.propertyName].properties = this.getFullMeta( aroFeature[propName] )
      } else if (metaItem.displayDataType.startsWith('array')) {
        //meta[propName].itemSchema = // how do we get this?
        //EquipmentComponent.getDisplayProperties
      }
    })

    return meta
  }
*/




  render () {
    //return ([])
    
    return (
      <AroFeatureEditorNode 
        objPath='' 
        isCollapsible={this.props.isCollapsible}
        isEditable={this.props.isEditable} 
        value={this.state.value} // this.state.value 
        meta={this.meta} 
        onChange={(event, propVal, path) => this._onChange(event, propVal, path)}
      ></AroFeatureEditorNode>
    )
    
  }

  _onChange (event, propVal, path) {
    let parsedPath = path
    // normalize notation for array indices
    parsedPath = parsedPath.replace('].', '.')
    parsedPath = parsedPath.replace('[', '.')
    parsedPath = parsedPath.replace(']', '')
    let pathAr = parsedPath.split('.')
    console.log({path:pathAr, val:this.state.value})
    pathAr.shift()
    let leafKey = pathAr.pop()
    // will omit functions
    //let pathClone = {...this.state.value}
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
    //console.log(stateRef)
    //console.log(leafKey)
    stateRef[leafKey] = propVal
    //console.log(this.state.value)
    
    //let newValObj = {...this.state.value, ...pathClone}
    //console.log(newValObj)
    //console.log(pathClone.getDisplayProperties())
    
    //TODO: given that this component will make the AROFeature it can keep a serilizable 
    //  version of the value object and clone it so we don't have to change state in place 

    this.setState({
      'value': this.state.value,
    })

    //this.props.onChange(newValObj, propVal, path, event)
  }  
}

export default AroFeatureEditor
