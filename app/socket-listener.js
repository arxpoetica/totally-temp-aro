var amqp = require('amqplib/callback_api')
var VectorTile = require('vector-tile').VectorTile
var Protobuf = require('pbf')

const exchangeName = 'aro_vt', queueName = 'vectorTileQueue'

amqp.connect('amqp://guest:guest@rabbitmq/', (err, conn) => {
  console.log('------------- Callback from connect')
  console.log(err)
  conn.createChannel(function(err, ch) {
    ch.assertQueue(queueName, {durable: false})
    ch.assertExchange(exchangeName, 'topic')
    ch.bindQueue(queueName, exchangeName, '#')

    ch.consume(queueName, function(msg) {
      console.log(" [x] Received %s", msg.content.toString())

      // There must be a better way than JSON.parse...
      // const mvtData = Buffer.from(JSON.parse(msg.content.toString()).data, 'base64')
      // var mapboxVectorTile = new VectorTile(new Protobuf(mvtData))
      // console.log(mapboxVectorTile.layers)


    }, {noAck: true})
  })
})
