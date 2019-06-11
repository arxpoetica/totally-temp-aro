import AroHttp from '../../common/aro-http'

export default class RingUtils {
  static getEquipmentDataPromise (equipmentId, planId, userId) {
    return AroHttp.get(`/service/plan-feature/${planId}/equipment/${equipmentId}?userId=${userId}`)
  }

  static parseRingData (ringData) {
    var rings = []
    console.log(ringData)
    return rings
  }

  static buildRingData (rings) {
    var ringData = []

    return ringData
  }
}
