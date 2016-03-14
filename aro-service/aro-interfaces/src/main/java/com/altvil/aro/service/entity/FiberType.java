package com.altvil.aro.service.entity;

public enum FiberType {

	ROOT("root"), BACKBONE("backbone"), FEEDER("feed"), DAG("dag"), DISTRIBUTION("dist"), GRAPH("graph"), DROP("drop"), UNKNOWN("unknown")

	;

	private String code;

	private FiberType(String code) {
		this.code = code;
	}

	public String getCode() {
		return code;
	}

}
