package com.altvil.aro.service.entity.impl;

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
		return getType().getSimpleName() + ":" + objectId;
	}

	
	
	
	

}
