import t from 'typy'; 

var nargs = /\${([0-9a-zA-Z_.0-9a-zA-Z_]+)\}/g
// Replace the key of type "${<key>}" in the string with associated value in the json
// arguments String and Jsonobject
// Ex: format("Hello ${name}, It's ${time.hour}", {
//   name: "Angular",
//   time: {hour: 12}
// })
export default function template(string) {
  var args

  if (arguments.length === 2 && typeof arguments[1] === "object") {
    args = arguments[1]
  } else {
    args = new Array(arguments.length - 1)
    for (var i = 1; i < arguments.length; ++i) {
      args[i - 1] = arguments[i]
    }
  }

  if (!args || !args.hasOwnProperty) {
    args = {}
  }

  return string.replace(nargs, function replaceArg(match, i, index) {
    var result

    if (string[index - 1] === "{" &&
      string[index + match.length] === "}") {
      return i
    } else if (args.hasOwnProperty(i)){
      result = args.hasOwnProperty(i) ? args[i] : null
      if (result === null || result === undefined) {
        return ""
      }
      return result
    } else if (t(args,i).isDefined) {
      result = t(args,i).safeObject
      return result
    } else {
      return ""
    }
  })
}
