package com.altvil.aro.model;

import java.io.Serializable;

public abstract class ComparableModel {

	@Override
	public int hashCode() {
		Serializable key = getIdKey();
		return key == null ? System.identityHashCode(this) : key.hashCode();
	}

	@Override
	public boolean equals(Object obj) {
		
		if( obj == null ) {
			return false ;
		}
		
		if( this == obj ) {
			return true ;
		}
		
		if( !obj.getClass().equals(this.getClass()) ) {
			return false ;
		}
		
		return isEqual(this.getIdKey(), ((ComparableModel) obj).getIdKey());
	}
	
	protected boolean isEqual(Serializable a, Serializable b) {
		if( a == null || b == null ) {
			return a == b ;
		}
		
		return a.equals(b) ;
	}

	protected abstract Serializable getIdKey();

}
