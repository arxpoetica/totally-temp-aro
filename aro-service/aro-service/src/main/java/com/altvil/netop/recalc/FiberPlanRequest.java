package com.altvil.netop.recalc;

public class FiberPlanRequest {

	public static class CableType {
	}
	
	private CableType cableType;
	private Long equipmentOid;

	public CableType getCableType() {
		return cableType;
	}

	public void setCableType(CableType cableType) {
		this.cableType = cableType;
	}

	public Long getEquipmentOid() {
		return equipmentOid;
	}

	public void setEquipmentOid(Long equipmentOid) {
		this.equipmentOid = equipmentOid;
	}

}
