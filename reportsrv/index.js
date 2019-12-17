const express = require('express')
const app = express()
 
app.get('/', function (req, res) {
  res.send('Hello World')
})

require('./routes/routes_report').configure(app)


var port = process.env.PORT || 7000
app.listen(port)