const kleur = require('kleur')

function blamo(lead = 'LOGGING') {
  console.log(kleur.bgBlack().white('                            '))
  console.log(kleur.bgBlack().white(`          ${lead}:          `))
  console.log(kleur.bgBlack().white('                            '))
  console.log()
}

exports.initSubscriptions = ServerSocketManager => {

    // const { onBroadcast } = ServerSocketManager.sockets
    // console.log(onBroadcast)

    blamo()
    // console.log(ServerSocketManager.subscribe)
    // console.log(ServerSocketManager.subscribe('broadcast'))

    // FIXME: work on this:
    // ServerSocketManager.subscribe('broadcast')

    // ServerSocketManager.onBroadcast({
    //   handler: payload => {
    //     blamo('SPECIAL')
    //     console.log({ payload })
    //     // ServerSocketManager.broadcastMessage(message)
    //   },
    // })

}
