package com.altvil.aro.service.entity;

public enum LocationEntityType {

	SmallBusiness(1), MediumBusiness(2), LargeBusiness(3), Household(4), CellTower(5),

	;

	int typeCode;

	private LocationEntityType(int typeCode) {
		this.typeCode = typeCode;
	}

	public int getTypeCode() {
		return typeCode;
	}

}
