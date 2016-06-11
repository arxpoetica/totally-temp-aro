package com.altvil.aro.service.entity;

public enum FiberType {
/*
	1,unknown,Unknown Fiber
	2,backbone,Back Bone Fiber
	3,feeder,Feeder Fiber
	4,distribution,Distribution Fiber
	5,drop,Drop Cable
*/
	
	UNKNOWN("unknown"), BACKBONE("backbone"), FEEDER("feed"), DISTRIBUTION("dist"), DROP("drop"),  ROOT("root")

	;

	private String code;

	private FiberType(String code) {
		this.code = code;
	}

	public String getCode() {
		return code;
	}

}
