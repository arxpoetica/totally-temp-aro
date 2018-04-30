var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')
var Handlebars = require('handlebars')

class ClassGenerator {

  constructor() {
  }

  // The main function that generates the source code for our class definitions
  static generateSourceCode() {

    // Register Handlebars helpers - used to compile class definition into source code
    this.registerHandlebarsHelpers(Handlebars)

    // Hold a list of class names to compiled strings
    var templateSource = fs.readFileSync('./class-template.handlebars').toString()
    var typeToSourceCode = {}
    var handlebarsCompiler = Handlebars.compile(templateSource)
    var classDefinition = require('./src/equipment-feature.json')
    this.buildTypeSourceCode(classDefinition, handlebarsCompiler, typeToSourceCode)

    // Dump to console
    Object.keys(typeToSourceCode).forEach((typeKey) => {
      console.log('-----------------------------------------------------------------------')
      console.log(typeToSourceCode[typeKey])
    })

    // Save to distribution folder
    this.deleteDistributionFolder()
      .then(() => {
        fs.mkdirSync(path.join(__dirname, './dist'))
        Object.keys(typeToSourceCode).forEach((typeKey) => {
          const className = this.getClassName(typeKey)
          const fileName = path.join(__dirname, `./dist/${className}.js`)
          fs.writeFileSync(fileName, typeToSourceCode[typeKey])
        })
      })
  }

  // Register all helpers for Handlebars, used to generate the source for a single class
  static registerHandlebarsHelpers(Handlebars) {
    Handlebars.registerHelper('classNameExtractor', (obj) => {
      const classNameKey = obj.hasOwnProperty('id') ? 'id' : '$ref'
      const className = obj[classNameKey]
      return className ? this.getClassName(className) : 'object'
    })
    Handlebars.registerHelper('isNotObject', (input) => input !== 'object')
    // Helper to detect if the object is a map (Java Map, or Javascript POJO)
    Handlebars.registerHelper('isMapObject', (input) => this.isMapObject(input))
    this.registerImportsHelper(Handlebars)
    this.registerAssignmentHelper(Handlebars)
  }

  // Register a Handlebars helper that generates the "this.xyz = new Abc()" statements
  // that are used in the constructor of our class
  static registerAssignmentHelper(Handlebars) {
    Handlebars.registerHelper('memberDeclaration', (memberName, memberObj) => {
      var result = `this.${memberName} = `
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

        case 'integer':
          result += '0'
          break
        
        case 'object':
          const classNameKey = memberObj.hasOwnProperty('id') ? 'id' : '$ref'
          const className = memberObj[classNameKey]
          if (className && (typeof className === 'string')) {
            result += `new ${this.getClassName(className)}()`
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
      return new Handlebars.SafeString(result)
    })
  }

  // Register a Handlebars helper that generates the "import ... from '...'" statements
  static registerImportsHelper(Handlebars) {
    Handlebars.registerHelper('importDependentClasses', (properties) => {
      var importsString = ''
      Object.keys(properties).forEach((propertyKey) => {
        const property = properties[propertyKey]
        if (property.type === 'object') {
          const classNameKey = property.hasOwnProperty('id') ? 'id' : '$ref'
          const fullClassName = property[classNameKey]
          if (fullClassName) {
            const className = this.getClassName(fullClassName)
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
  static isMapObject(obj) {
    console.log(obj)
    return (obj.type === 'object') && obj.hasOwnProperty('additionalProperties')
  }

  // Returns the class name (e.g. Geometry) from a fully-qualified name (e.g. com.altvil:Geometry)
  static getClassName(className) {
    if (className) {
      return className.substr(className.lastIndexOf(':') + 1)
    } else {
      return null
    }
  }

  static buildTypeSourceCode(classDefinition, handlebarsCompiler, classToSourceCode) {
    // Only generate source code if we haven't generated it before.
    if (classDefinition.type === 'object' && classDefinition.id && !classToSourceCode.hasOwnProperty(classDefinition.id)) {
      // Build the source for this class
      classToSourceCode[classDefinition.id] = handlebarsCompiler(classDefinition)
    }
    if (classDefinition.properties) {
      Object.keys(classDefinition.properties).forEach((propertyKey) => {
        const property = classDefinition.properties[propertyKey]
        this.buildTypeSourceCode(property, handlebarsCompiler, classToSourceCode)
      })
    }
  }

  static deleteDistributionFolder() {
    return new Promise((resolve, reject) => {
      rimraf('./dist', () => resolve())
    })
  }
}

ClassGenerator.generateSourceCode()