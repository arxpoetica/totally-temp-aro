var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')
var Handlebars = require('handlebars')

class ClassGenerator {
  constructor () {}

  // The main function that generates the source code for our class definitions
  static generateSourceCode () {
    // TODO: use GET '/v1/schema/attributes' endpoint in the app, not in build
    var classMetas = require('./typesmeta.json')
    // TODO: use GET '/v1/schema/json' endpoint in the app, not in build
    var typeDefinitions = require('./types.json')
    // TODO: use GET '/v1/schema/type-mapping' endpoint in the app, not in build
    var dataTypeToUrnList = require('./dataTypeToUrn.json')

    // Register Handlebars helpers - used to compile class definition into source code
    this.registerHandlebarsHelpers(Handlebars)
    // Hold a list of class names to compiled strings
    var templateSource = fs.readFileSync('./class-template.hbs').toString()
    var typeToSourceCode = {}
    var handlebarsCompiler = Handlebars.compile(templateSource)
    // Create a map of type URN to its display properties
    
    var typeToDisplayProperties = {}
    var typeToOrderedPropertyNames = {}
    classMetas.forEach((classMeta) => {
      //typeToDisplayProperties[classMeta.schemaReference] = classMeta.displayProperties.properties || []
      typeToDisplayProperties[classMeta.schemaReference] = classMeta.displayProperties || []
      typeToOrderedPropertyNames[classMeta.schemaReference] = classMeta.orderedPropertyNames || []
    })
    
    typeDefinitions.forEach((typeDefinition) => this.buildTypeSourceCode(typeDefinition, handlebarsCompiler, typeToSourceCode, typeToDisplayProperties, typeToOrderedPropertyNames))

    var referencedTypes = new Set()
    typeDefinitions.forEach((typeDefinition) => this.getAllTypes(typeDefinition, referencedTypes))

    // Save to distribution folder
    this.deleteDistributionFolder()
      .then(() => {
        fs.mkdirSync(path.join(__dirname, '../dist'))
        Object.keys(typeToSourceCode).forEach((typeKey) => {
          const className = this.getClassName(typeKey)
          const fileName = path.join(__dirname, `../dist/${className}.js`)
          fs.writeFileSync(fileName, typeToSourceCode[typeKey])
        })

        // Build the AroFeatureFactory
        var templateFactory = Handlebars.compile(fs.readFileSync('./aro-feature-factory.hbs').toString())
        
        const fileName = path.join(__dirname, `../dist/AroFeatureFactory.js`)
        fs.writeFileSync(fileName, templateFactory(dataTypeToUrnList))
      })
  }

  // Gets the URN (if available) of a type
  static getUrnForType (typeDefinition) {
    const typeUrnKey = typeDefinition.hasOwnProperty('id') ? 'id' : '$ref'
    return typeDefinition[typeUrnKey] // CAN RETURN NULL for types like 'string', 'number', etc.
  }

  // Register all helpers for Handlebars, used to generate the source for a single class
  static registerHandlebarsHelpers (Handlebars) {
    // If we don't have a URN return 'object'
    Handlebars.registerHelper('classNameExtractor', (obj) => this.getClassName(this.getUrnForType(obj)) || 'object')
    Handlebars.registerHelper('classUrnExtractor', (obj) => this.getUrnForType(obj) || 'object')
    Handlebars.registerHelper('isPrimitive', (input) => {
      const primitives = ['string', 'number', 'boolean', 'integer']
      return primitives.indexOf(input) >= 0
    })
    Handlebars.registerHelper('toJSON', (input) => JSON.stringify(input, null, 2))
    Handlebars.registerHelper('toJSONByOrder', (input, propOrder) => {
      var props = JSON.parse(JSON.stringify(input))
      var prepend = []
      for (var orderI = 0; orderI < propOrder.length; orderI++) {
        var propName = propOrder[orderI]
        var propIndex = -1
        for (var propsI = 0; propsI < props.length; propsI++) {
          if (propName == props[propsI].propertyName) {
            propIndex = propsI
            break
          }
        }
        if (propIndex > -1) {
          prepend.push(props.splice(propIndex, 1)[0])
        }
      }
      props = prepend.concat(props)
      return JSON.stringify(props, null, 2)
    })
    // Helper to detect if the object is a map (Java Map, or Javascript POJO)
    Handlebars.registerHelper('isMapObject', (input) => this.isMapObject(input))
    Handlebars.registerHelper('isAnyObject', (input) => input.type === 'any')
    Handlebars.registerHelper('isArray', (input) => {
      return input.type === 'array'
    })
    Handlebars.registerHelper('shouldIncludePropertyType', (input, containerType) => {
      if (!input) {
        return false
      }
      const classDef = input.items || input
      if (!classDef) {
        return false
      }
      const inputUrn = this.getUrnForType(classDef)
      const containerUrn = this.getUrnForType(containerType)
      return (input.type === 'array') && (inputUrn !== containerUrn)
    })

    Handlebars.registerHelper('buildFullDisplayProperties', (input, propOrder) => this.buildFullDisplayProperties(input, propOrder))

    this.registerImportsHelper(Handlebars)
    this.registerAssignmentHelper(Handlebars)
  }




  static buildFullDisplayProperties (input, propOrder) {
    var props = JSON.parse(JSON.stringify(input))
    let metaProps = {}
    props.forEach(item => {
      // get order from propOrder
      item.properties = {}
      item.displayOrder = propOrder.indexOf(item.propertyName)
      let displayDataType = item.displayDataType
      // TODO: arrays are a problem - need to change the way service makes meta data
      //  like what about an array of integers?
      let len = displayDataType.length
      if ('array[' === displayDataType.substring(0, 6)
        && ']' === displayDataType.charAt(len-1)) {
          displayDataType = displayDataType.substring(6, len-1)
          len = displayDataType.length
      }
      if ('object{' === displayDataType.substring(0, 7)
        && '}' === displayDataType.charAt(len-1)) {
          displayDataType = displayDataType.substring(7, len-1)
          len = displayDataType.length
      }

      if ('urn:' === displayDataType.substring(0, 4)) {
        let className = this.getClassName(displayDataType)
        item.properties = `${className}.getFullDisplayProperties()`
      }
      // displayDataType
      // if is array or object
      // item.properties = a dynamic call to type.getFullDisplayProperties
      metaProps[item.propertyName] = item
    })

    let stringMProps = JSON.stringify(metaProps, null, 2)
    stringMProps = stringMProps.replace(/"properties": "(.*?)"/g, (match) => {
      return '"properties": '+ match.slice(15, -1)
    })

    //return JSON.stringify(metaProps)
    //return JSON.stringify(metaProps, null, 2)
    return stringMProps
  }




  // Register a Handlebars helper that generates the "this.xyz = new Abc()" statements
  // that are used in the constructor of our class
  static registerAssignmentHelper (Handlebars) {
    Handlebars.registerHelper('memberDeclaration', (memberName, memberObj, display) => {
      var result = `this.${memberName} = `
      /*
      switch(memberObj.type) {
        case 'string':
          result += '\'\''
          break

        case 'number':
          result += '0.0'
          break

        case 'boolean':
          result += 'false'
          break

        case 'any':
          result += '{}'
          break

        case 'array':
          result += '[]'
          break

        case 'integer':
          result += '0'
          break

        case 'object':
          const typeUrn = this.getUrnForType(memberObj)
          if (typeUrn && (typeof typeUrn === 'string')) {
            result += `new ${this.getClassName(typeUrn)}()`
          } else if (this.isMapObject(memberObj)) {
            result += `{}`  // This is a "map" object or a POJO object
          } else {
            result = `this.${memberName}_error${Math.round(Math.random() * 1000)} = 'This is an error'`
          }
          break

        default:
          // throw `Unsupported member type ${memberObj.id || memberObj['$ref']}`
          break
      }
      */

      if (memberObj.type == 'string' ||
        memberObj.type == 'number' ||
        memberObj.type == 'boolean' ||
        memberObj.type == 'integer') {
        var defaultVal = null
        for (var displayI = 0; displayI < display.length; displayI++) {
          if (memberName == display[displayI].propertyName) {
            if (display[displayI].defaultValue.indexOf('${') == -1) { // we're not set up to deal with expressions yet
              defaultVal = display[displayI].defaultValue
            } else {
              /*
              var ctx = {}
              ctx.today = function(){return new Date().getTime()}
              console.log( '`' + display[displayI].defaultValue + '`')
              console.log( eval('`' + display[displayI].defaultValue  + '`') )
              defaultVal = eval('`' + display[displayI].defaultValue  + '`')
              */
            }
            break
          }
        }
        /*
        if (null == defaultVal || "" == defaultVal){ // null OR undefined
          switch(memberObj.type) {
            case 'string':
              defaultVal = '\'\''
              break

            case 'number':
              defaultVal = '0.0'
              break

            case 'boolean':
              defaultVal = 'false'
              break

            case 'integer':
              defaultVal = '0'
              break
          }
        }
        */
        if (defaultVal == null || defaultVal == '') defaultVal = '\'\''

        result += defaultVal
      } else if (memberObj.type == 'any') {
        result += '{}'
      } else if (memberObj.type == 'array') {
        result += '[]'
      } else if (memberObj.type == 'object') {
        const typeUrn = this.getUrnForType(memberObj)
        if (typeUrn && (typeof typeUrn === 'string')) {
          result += `new ${this.getClassName(typeUrn)}()`
        } else if (this.isMapObject(memberObj)) {
          result += `{}` // This is a "map" object or a POJO object
        } else {
          result = `this.${memberName}_error${Math.round(Math.random() * 1000)} = 'This is an error'`
        }
      } else {
        result += 'null'
      }
      return new Handlebars.SafeString(result)
    })
  }

  // Register a Handlebars helper that generates the "import ... from '...'" statements
  static registerImportsHelper (Handlebars) {
    Handlebars.registerHelper('importDependentClasses', (properties) => {
      if (!properties) {
        return
      }
      var importsString = ''
      Object.keys(properties).forEach((propertyKey) => {
        const property = properties[propertyKey]
        if (property.type === 'object') {
          const typeUrn = this.getUrnForType(property)
          if (typeUrn) {
            const className = this.getClassName(typeUrn)
            importsString += `import ${className} from './${className}'\n`
          } else if (this.isMapObject(property)) {
            // Do nothing - A "map" object is "{}"
          } else {
            importsString += `// ERROR: class id not found for ${propertyKey}\n`
          }
        }
      })
      return new Handlebars.SafeString(importsString)
    })
  }

  // Returns true if this is a map (e.g. HashMap, POJO) object
  static isMapObject (obj) {
    return (obj.type === 'object') && obj.hasOwnProperty('additionalProperties')
  }

  // Returns the class name (e.g. Geometry) from a fully-qualified name (e.g. com.altvil:Geometry)
  static getClassName (className) {
    if (className) {
      return className.substr(className.lastIndexOf(':') + 1)
    } else {
      return null
    }
  }

  // We have the definition of a "type container". This object will contain details on the type and its properties.
  // This is done because for 'array' types, the type container is within the "items" property of the array definition.
  static getTypeContainer (typeDefinition) {
    var typeContainer = null
    // Only generate source code if we haven't generated it before.
    if (typeDefinition.type === 'object') {
      typeContainer = typeDefinition
    } else if (typeDefinition.type === 'array') {
      typeContainer = typeDefinition.items
    }
    return typeContainer // CAN RETURN NULL for typeDefinition.type = 'string', etc.
  }

  // Builds the source code for the specified type
  static buildTypeSourceCode (classDefinition, handlebarsCompiler, typeToSourceCode, typeToDisplayProperties, typeToOrderedPropertyNames) {
    var typeContainer = this.getTypeContainer(classDefinition)
    if (typeContainer && typeContainer.hasOwnProperty('id') && !typeToSourceCode.hasOwnProperty(typeContainer.id)) {
      // Build the source for this class
      typeToSourceCode[typeContainer.id] = handlebarsCompiler({
        classDef: typeContainer,
        display: typeToDisplayProperties[typeContainer.id],
        propOrder: typeToOrderedPropertyNames[typeContainer.id]
      })
      if (typeContainer.properties) {
        Object.keys(typeContainer.properties).forEach((propertyKey) => {
          const property = typeContainer.properties[propertyKey]
          this.buildTypeSourceCode(property, handlebarsCompiler, typeToSourceCode, typeToDisplayProperties, typeToOrderedPropertyNames)
        })
      }
    }
  }

  // Gets a list of all types referenced in a type definition
  static getAllTypes (typeDefinition, referencedTypes) {
    const typeContainer = this.getTypeContainer(typeDefinition)
    if (typeContainer) {
      const typeUrn = this.getUrnForType(typeContainer)
      if (typeUrn) {
        referencedTypes.add(typeUrn)
      }
      if (typeContainer.properties) {
        Object.keys(typeContainer.properties).forEach((propertyKey) => {
          const property = typeContainer.properties[propertyKey]
          this.getAllTypes(property, referencedTypes)
        })
      }
    }
  }

  static deleteDistributionFolder () {
    return new Promise((resolve, reject) => {
      rimraf('../dist', () => resolve())
    })
  }
}

ClassGenerator.generateSourceCode()
