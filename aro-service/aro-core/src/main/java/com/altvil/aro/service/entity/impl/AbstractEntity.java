package com.altvil.aro.service.entity.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;

public abstract class AbstractEntity implements AroEntity {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Long objectId;

	public AbstractEntity(Long objectId) {
		super();
		this.objectId = objectId;
	}

	@Override
	public Long getObjectId() {
		return objectId;
	}

	@Override
	public String toString() {
		return new ToStringBuilder(this).append("objectId", objectId).toString();
	}

	@Override
	public int hashCode() {
		return getObjectId().hashCode() ;
	}

	@Override
	public boolean equals(Object obj) {
		
		if( obj == null ) {
			return false ;
		}
		
		if( obj == this ) {
			return true ;
		}
		
		if( this.getClass().isAssignableFrom(obj.getClass())) {
			return this.getObjectId() .equals(((AroEntity) obj).getObjectId()) ;
		}
		
		return false ;
	}
	
	

	
	
	
	

}
