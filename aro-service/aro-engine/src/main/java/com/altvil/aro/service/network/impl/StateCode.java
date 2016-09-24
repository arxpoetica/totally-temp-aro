package com.altvil.aro.service.network.impl;

import java.io.Serializable;

public class StateCode implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String state ;
	private String fipsCode ;
	
	public StateCode(String state, String fipsCode) {
		super();
		this.state = state;
		this.fipsCode = fipsCode;
		
		if( state == null || fipsCode == null ) {
			throw new NullPointerException() ;
		}
	}
	public String getState() {
		return state;
	}
	public String getFipsCode() {
		return fipsCode;
	}
	
	
	

}
