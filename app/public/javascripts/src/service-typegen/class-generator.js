var fs = require('fs')
var Handlebars = require('handlebars')

class ClassGenerator {

  constructor() {
  }

  generateClass() {
    var classDefinition = require('./src/equipment-feature.json')
    
    var templateSource = fs.readFileSync('./class-template.handlebars').toString()
    Handlebars.registerHelper('classNameExtractor', (inputString) => inputString.substr(inputString.lastIndexOf(':') + 1))
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
          throw `Unsupported member type ${memberType}`
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

    var classTemplate = Handlebars.compile(templateSource)
    const result = classTemplate(classDefinition)
    console.log(result)
  }

  getClassName(classDef) {
    if (classDef.id) {
      return classDef.id.substr(classDef.id.lastIndexOf(':') + 1)
    } else {
      return null
    }
  }

}

(new ClassGenerator()).generateClass()