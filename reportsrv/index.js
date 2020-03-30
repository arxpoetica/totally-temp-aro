const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: '2mb' }))
app.get('/', function (req, res) {
  res.send('Hello World')
})

require('./routes/routes_report').configure(app)


var port = process.env.PORT || 7000
app.listen(port)