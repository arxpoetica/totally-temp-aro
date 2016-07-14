package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Transient;

public abstract class ComparableModel {

	@Override
	public int hashCode() {
		Serializable key = idKey();
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
		
		if( !(obj instanceof ComparableModel) ) {
			return false ;
		}
		
		return isEqual(this.idKey(), ((ComparableModel) obj).idKey());
	}
	
	protected boolean isEqual(Serializable a, Serializable b) {
		if( a == null || b == null ) {
			return a == b ;
		}
		
		return a.equals(b) ;
	}

	@Transient
	protected abstract Serializable idKey();

}
