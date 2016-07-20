package com.altvil.aro.service.report;

public enum NetworkStatisticType {
	
	irr(true, "irr"), 
	npv(true, "npv"),
	cashflow(false, "cashflow")

	;
	
	private boolean scalar;
	private String code;

	private NetworkStatisticType(boolean scalar, String code) {
		this.code = code;
		this.scalar = scalar ;
	}

	public String getCode() {
		return code;
	}

	public boolean isScalar() {
		return scalar;
	}
	
	

}
