package com.altvil.aro.service.report;

public enum NetworkStatisticType {

	irr(true, "irr"), npv(true, "npv"), cashflow(false, "cashflow"), roic_irr(
			true, "roic_irr"), roic_npv(true, "roic_npv"),

	;

	private boolean scalar;
	private String code;

	private NetworkStatisticType(boolean scalar, String code) {
		this.code = code;
		this.scalar = scalar;
	}

	public String getCode() {
		return code;
	}

	public boolean isScalar() {
		return scalar;
	}

}
