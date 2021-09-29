import React, { useState } from 'react'
import { connect } from 'react-redux'
import EquipmentInterfaceValue from './equipment-interface-value.jsx'

export const EquipmentInterfaceTree = (props) => {

  const [state, setState] = useState({
    pixelsPerIndentationLevel: 20,
    isKeyExpanded: {}
  })

  const { pixelsPerIndentationLevel, isKeyExpanded } = state

  const { objectToView, rootMetaData, isEdit, objectMetaData, indentationLevel } = props

  const isList = () => {
    return (typeof objectMetaData !== 'undefined' && objectMetaData.displayDataType.startsWith('array'))
  }

  const toggleIsKeyExpanded = (index) => {
    isKeyExpanded[index] = !isKeyExpanded[index]
    setState((state) => ({ ...state, isKeyExpanded }))
  }

  const doShow = (prop, data) => {
    if (typeof data === 'undefined' || data == null) data = objectToView
    if (typeof data === 'undefined' || data == null) return false
    if (!prop.visible) return false
    if (!data.hasOwnProperty(prop.propertyName)) return false

    return true
  }

  const getSummeryCount = (propVal) => {
    var summeryCount = 0
    if (typeof propVal !== 'undefined' && typeof propVal.getDisplayProperties === 'function') {
      var props = propVal.getDisplayProperties()
      for (var i = 0; i < props.length; i++) {
        if (props[i].hasOwnProperty('levelOfDetail') && props[i].levelOfDetail == '1') {
          summeryCount++
        }
      }
    }
    return summeryCount
  }

  const hasChildren = (data) => {
    if (typeof data === 'undefined' || data == null) return false
    return (typeof data.getDisplayProperties === 'function')
  }

  const isObject = (data) => {
    if (typeof data === 'undefined' || data == null) return false
    return (typeof data === 'object')
  }

  return (
    <div className="ei-gen-level" style={{ paddingLeft: indentationLevel > 0 ? pixelsPerIndentationLevel : 0 + 'px' }}>
      {
        !isList() &&
        <div>
          {
            objectToView && objectToView.getDisplayProperties().map((prop, index) => {

              const propVal = objectToView[prop.propertyName]
              const foldoutIndex = index
              const summeryCount = getSummeryCount(propVal)

              return doShow(prop) &&
                <div className="ei-items-contain">
                  {
                    (prop.displayDataType.startsWith('object') || prop.displayDataType.startsWith('array')) &&
                    <div className="ei-foldout" style={{width: "100%"}}>
                      <div className="ei-header" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                        {
                          isKeyExpanded && !isKeyExpanded[foldoutIndex]
                          ? <i className="far fa-plus-square ei-foldout-icon" />
                          : <i className="far fa-minus-square ei-foldout-icon" />
                        }
                        {prop.displayName} &nbsp;
                        {
                          prop.displayDataType.startsWith('array') &&
                          <span className="ei-header-info">{ propVal.length } item{ 1 != propVal.length && <span>s</span> }</span>
                        }
                        {
                          !isKeyExpanded[foldoutIndex] && summeryCount > 0 && <div className="ei-foldout-state-label">summary</div>
                        }
                        {
                          isKeyExpanded[foldoutIndex] && summeryCount > 0 && <div className="ei-foldout-state-label">detail</div>
                        }
                      </div>

                      {/* summery items */}
                        {
                          summeryCount > 0 &&
                          <div className="ei-gen-level ei-internal-level" style={{ paddingLeft: pixelsPerIndentationLevel+1 + 'px' }}>
                            {/* Loop through all the summery props */}
                            {
                              propVal.getDisplayProperties().map((childProp) => {
                                return childProp.levelOfDetail == '1' && doShow(childProp, propVal) &&
                                <div className="ei-items-contain">
                                  {
                                    (prop.displayDataType.startsWith('object') || prop.displayDataType.startsWith('array')) &&
                                    <div className="ei-property-item">
                                      <div style={{flex: "1 1 50%"}}><div>{childProp.displayName}</div></div>
                                      <EquipmentInterfaceValue
                                        displayProps={childProp}
                                        model={propVal[childProp.propertyName]}
                                        isEdit={isEdit}
                                        parentObj={propVal}
                                        rootMetaData={rootMetaData}
                                      />
                                    </div>
                                  }
                                </div>
                              })
                            }
                          </div>
                        }

                        {/* RECURSIVE call to aro-object-editor. Not creating object if indentation level is too high */}
                        {
                          indentationLevel <= 200 &&
                          <div className="ei-internal-gen" style={{ display: isKeyExpanded[foldoutIndex] ? 'inline' : 'none' }}>
                            <EquipmentInterfaceTree
                              objectToView={propVal}
                              objectMetaData={prop}
                              isEdit={isEdit}
                              rootMetaData={rootMetaData}
                              parentObj={objectToView}
                              indentationLevel={indentationLevel+1}
                            />
                          </div>
                        }
                        {
                          !isKeyExpanded[foldoutIndex] && summeryCount > 0 && 
                          <div className="ei-foldout-state-label-bottom" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                            [ + detail ]
                          </div>
                        }
                        {
                          isKeyExpanded[foldoutIndex] && summeryCount > 0 &&
                          <div className="ei-foldout-state-label-bottom" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                            [ - summary ]
                          </div>
                        }
                    </div>
                    }
                    {/* If this key-value pair is NOT expandable and has an editable value, show an input box to edit it */}
                    {
                      (!prop.displayDataType.startsWith('object') && !prop.displayDataType.startsWith('array') && '1' != prop.levelOfDetail) &&
                      <div className="ei-property-item">
                        <div style={{flex: "1 1 50%"}}><div>{prop.displayName}</div></div>
                        <EquipmentInterfaceValue
                          displayProps={prop}
                          model={objectToView[prop.propertyName]}
                          isEdit={isEdit}
                          parentObj={objectToView}
                          rootMetaData={rootMetaData}
                        />
                      </div>
                    }
                </div>
            })
          }
        </div>
      }

      {
        (isList() && objectMetaData.visible) &&
        <div>
          {
            isObject(objectToView) && Object.entries(objectToView).map(([ objKey, propVal ], index) => {

              const prop = objectMetaData
              const foldoutIndex = index
              const summeryCount = getSummeryCount(propVal)

              return (
                <div className="ei-items-contain">
                  {
                    (hasChildren(propVal) && prop.displayDataType.startsWith('object') || prop.displayDataType.startsWith('array')) &&
                    <div className="ei-foldout" style={{width: "100%"}}>
                      <div className="ei-header" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                        {
                          isKeyExpanded && !isKeyExpanded[foldoutIndex]
                          ? <i className="far fa-plus-square ei-foldout-icon" />
                          : <i className="far fa-minus-square ei-foldout-icon" />
                        }
                        {
                          prop.displayDataType.startsWith('array') &&
                          <span>{index+1}: </span>
                        }
                        {prop.displayName}
                        {
                          !isKeyExpanded[foldoutIndex] && summeryCount > 0 && <div className="ei-foldout-state-label">summary</div>
                        }
                        {
                          isKeyExpanded[foldoutIndex] && summeryCount > 0 && <div className="ei-foldout-state-label">detail</div>
                        }
                      </div>

                      {/* summery items */}
                        <div className="ei-gen-level ei-internal-level" style={{ paddingLeft: pixelsPerIndentationLevel+1 + 'px' }}>
                          {/* Loop through all the summery props */}
                          {
                            propVal.getDisplayProperties().map((childProp) => {
                              return '1' == childProp.levelOfDetail && doShow(childProp, propVal) &&
                              <div className="ei-items-contain">
                                {
                                  !childProp.displayDataType.startsWith('object') && !childProp.displayDataType.startsWith('array') &&
                                  <div className="ei-property-item">
                                    <div style={{flex: "1 1 50%"}}><div>{childProp.displayName}</div></div>
                                    <EquipmentInterfaceValue
                                      displayProps={childProp}
                                      model={propVal[childProp.propertyName]}
                                      isEdit={isEdit}
                                      parentObj={propVal}
                                      rootMetaData={rootMetaData}
                                    />
                                  </div>
                                }
                              </div>
                            })
                          }
                        </div>
                        
                        {/* RECURSIVE call to aro-object-editor. Not creating object if indentation level is too high */}
                        {
                          indentationLevel <= 200 &&
                          <div className="ei-internal-gen" style={{ display: isKeyExpanded[foldoutIndex] ? 'inline' : 'none' }}>
                            <EquipmentInterfaceTree
                              objectToView={propVal}
                              isEdit={isEdit}
                              rootMetaData={rootMetaData}
                              parentObj={objectToView}
                              indentationLevel={indentationLevel+1}
                            />
                          </div>
                        }

                        {
                          !isKeyExpanded[foldoutIndex] && summeryCount > 0 && 
                          <div className="ei-foldout-state-label-bottom" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                            [ + detail ]
                          </div>
                        }
                        {
                          isKeyExpanded[foldoutIndex] && summeryCount > 0 &&
                          <div className="ei-foldout-state-label-bottom" onClick={() => toggleIsKeyExpanded(foldoutIndex)}>
                            [ - summary ]
                          </div>
                        }
                    </div>
                  }
                  {/* If this key-value pair is NOT expandable and has an editable value, show an input box to edit it */}
                  {
                      !prop.displayDataType.startsWith('object') && !prop.displayDataType.startsWith('array') && '1' != prop.levelOfDetail &&
                      <div className="ei-property-item">
                        <div style={{flex: "1 1 50%"}}><div>{prop.displayName}</div></div>
                        <EquipmentInterfaceValue
                          displayProps={prop}
                          model={objectToView[prop.propertyName]}
                          isEdit={isEdit}
                          parentObj={objectToView}
                          rootMetaData={rootMetaData}
                        />
                      </div>
                    }
                </div>
              )
            })
          }
        </div>
      }
    </div>
  )
}

const mapStateToProps = (state) => ({
})

const mapDispatchToProps = (dispatch) => ({
})

export default connect(mapStateToProps, mapDispatchToProps)(EquipmentInterfaceTree)