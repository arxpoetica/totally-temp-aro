package com.altvil.interfaces;

public enum CableConstructionEnum {

	UNKNOWN("unkown", false), ESTIMATED("estimated", false), ARIAL("arial", true), BURIED("buried", true), 
	UNDERGROUND("undergroumd", true), CONDUIT("conduit",
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

	public String getCodeName() {
		return codeName;
	}

	
	
}
