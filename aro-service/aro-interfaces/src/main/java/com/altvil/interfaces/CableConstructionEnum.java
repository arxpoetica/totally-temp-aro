package com.altvil.interfaces;

public enum CableConstructionEnum {

	UNKNOWN("unkown", false), ESTIMATED("estimated", false), ARIEL("ariel", true), BURIED("buried", true), 
	UNDERGROUND("underground", true), CONDUIT("conduit",
			true), OBSTACLE("obstacle",true), 

	;

	private String codeName ;
	private boolean priceCoded;

	private CableConstructionEnum(String codeName, boolean priceCoded) {
		this.priceCoded = priceCoded;
		this.codeName = codeName;
	}

	public boolean isPriceCoded() {
		return priceCoded;
	}

	public boolean isComputedEstimate() {
		return this == ESTIMATED;
	}

	public String getCode() {
		return codeName;
	}
	
	
	public boolean isValidCode() {
		return this != UNKNOWN;
	}

	
	
}
