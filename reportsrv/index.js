const express = require('express')
const bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

const app = express()
app.use(cookieParser())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: '2mb' }))

require('./routes/routes_report').configure(app)

var port = process.env.PORT || 7000
app.listen(port)