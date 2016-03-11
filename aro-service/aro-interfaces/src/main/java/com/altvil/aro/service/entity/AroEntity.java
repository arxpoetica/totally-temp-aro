package com.altvil.aro.service.entity;

import java.io.Serializable;


public interface AroEntity extends Serializable {

	public Class<? extends AroEntity> getType();

	
	//public FiberType getFiberSourceType() ;
	
	public Long getObjectId();
	
	public void accept(AroEntityVisitor visitor) ;
	
}
