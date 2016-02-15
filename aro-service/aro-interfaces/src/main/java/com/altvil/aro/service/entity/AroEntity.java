package com.altvil.aro.service.entity;

import java.io.Serializable;


public interface AroEntity extends Serializable {

	public Class<? extends AroEntity> getType();

	public Long getObjectId();
	
	public boolean isTransient() ;
	public void updateId(Long id) ;
	
	public void accept(AroEntityVisitor visitor) ;
	
}
