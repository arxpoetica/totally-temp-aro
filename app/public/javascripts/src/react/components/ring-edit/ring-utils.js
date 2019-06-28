import AroHttp from '../../common/aro-http'

export default class RingUtils {
  static getEquipmentDataPromise (equipmentId, planId, userId) {
    return AroHttp.get(`/service/plan-feature/${planId}/equipment/${equipmentId}?userId=${userId}`)
  }
}
