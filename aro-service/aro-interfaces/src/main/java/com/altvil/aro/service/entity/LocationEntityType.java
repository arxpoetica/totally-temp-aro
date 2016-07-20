package com.altvil.aro.service.entity;

public enum LocationEntityType {

	small(1), medium(2), large(3), household(4), celltower(5),

	;

	int typeCode;

	private LocationEntityType(int typeCode) {
		this.typeCode = typeCode;
	}

	public int getTypeCode() {
		return typeCode;
	}

}
