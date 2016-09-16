package com.altvil.aro.service.reference;

import com.altvil.utils.reference.VolatileReferenceInfo;

public class VolatileState {

	private ReferenceType type;
	private VolatileReferenceInfo info;

	public ReferenceType getType() {
		return type;
	}

	public void setType(ReferenceType type) {
		this.type = type;
	}

	public VolatileReferenceInfo getInfo() {
		return info;
	}

	public void setInfo(VolatileReferenceInfo info) {
		this.info = info;
	}

}
