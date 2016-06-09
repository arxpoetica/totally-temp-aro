package com.altvil.aro.service.entity;

public enum FiberType {

	ROOT("root"), UNKNOWN("unknown"), BACKBONE("backbone"), FEEDER("feed"), DISTRIBUTION("dist"), DROP("drop")
	
	//ROOT("root"), BACKBONE("backbone"), FEEDER("feed"),  DISTRIBUTION("dist"), DROP("drop"), UNKNOWN("unknown")
	
	;

	private String code;

	private FiberType(String code) {
		this.code = code;
	}

	public String getCode() {
		return code;
	}

}
