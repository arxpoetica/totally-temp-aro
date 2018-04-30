var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')
var Handlebars = require('handlebars')

class ClassGenerator {

  constructor() {
  }

  generateClass() {
    var classDefinition = require('./src/equipment-feature.json')
    
    var templateSource = fs.readFileSync('./class-template.handlebars').toString()
    Handlebars.registerHelper('classNameExtractor', (inputString) => {
      return inputString ? inputString.substr(inputString.lastIndexOf(':') + 1) : 'object'
    })
    Handlebars.registerHelper('isNotObject', (input) => input !== 'object')
    Handlebars.registerHelper('memberDeclaration', (memberName, memberType, objectId) => {
      var result = `this.${memberName} = `
      switch(memberType) {
        case 'string':
          result += '\'\''
          break
        
        case 'number':
          result += '0.0'
          break

        case 'integer':
          result += '0'
          break
        
        case 'object':
          if (objectId && (typeof objectId === 'string')) {
            result += `new ${objectId.substr(objectId.lastIndexOf(':') + 1)}()`
          } else {
            result = `this.${memberName}_error${Math.round(Math.random() * 1000)} = 'This is an error'`
          }
          break

        default:
          // throw `Unsupported member type ${memberType}`
          break
      }
      return new Handlebars.SafeString(result)
    })

    Handlebars.registerHelper('importDependentClasses', (properties) => {
      var importsString = ''
      Object.keys(properties).forEach((propertyKey) => {
        const property = properties[propertyKey]
        if (property.type === 'object') {
          if (property.id) {
            const className = property.id.substr(property.id.lastIndexOf(':') + 1)
            importsString += `import ${className} from './${className}'\n`
          } else {
            importsString += `// ERROR: class id not found for ${propertyKey}\n`
          }
        }
      })
      return new Handlebars.SafeString(importsString)
    })

    // Hold a list of class names to compiled strings
    var typeToSourceCode = {}
    var handlebarsCompiler = Handlebars.compile(templateSource)
    // const result = handlebarsCompiler(classDefinition)
    // console.log(result)
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
          const className = typeKey.substr(typeKey.lastIndexOf(':') + 1)
          const fileName = path.join(__dirname, `./dist/${className}.js`)
          fs.writeFileSync(fileName, typeToSourceCode[typeKey])
        })
      })
    
  }

  getClassName(classDef) {
    if (classDef.id) {
      return classDef.id.substr(classDef.id.lastIndexOf(':') + 1)
    } else {
      return null
    }
  }

  buildTypeSourceCode(classDefinition, handlebarsCompiler, classToSourceCode) {
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

  deleteDistributionFolder() {
    return new Promise((resolve, reject) => {
      rimraf('./dist', () => resolve())
    })
  }
}

(new ClassGenerator()).generateClass()