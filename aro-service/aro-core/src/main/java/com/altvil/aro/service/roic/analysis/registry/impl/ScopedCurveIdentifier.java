package com.altvil.aro.service.roic.analysis.registry.impl;

import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class ScopedCurveIdentifier  implements CurveIdentifier {

	private String curveName ;
	
	public ScopedCurveIdentifier(String curveName) {
		super();
		this.curveName = curveName;
	}

	@Override
	public int hashCode() {
		return curveName.hashCode() ;
	}

	@Override
	public boolean equals(Object other) {
		if( other instanceof ScopedCurveIdentifier) {
			return ((ScopedCurveIdentifier) other).equals(curveName) ;
		}
		return false ;
	}

	@Override
	public String toString() {
		return curveName ;
	}

	
	
}
