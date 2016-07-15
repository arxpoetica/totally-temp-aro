package com.altvil.aro.service.report;

public enum NetworkStatisticType {
	irr("irr"), npv("npv");

	private String code;

	private NetworkStatisticType(String code) {
		this.code = code;
	}

	public String getCode() {
		return code;
	}

}
