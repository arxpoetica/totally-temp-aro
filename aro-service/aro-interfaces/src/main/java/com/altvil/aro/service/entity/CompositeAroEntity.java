package com.altvil.aro.service.entity;

import java.util.Collection;

public interface CompositeAroEntity extends AroEntity {

	public Collection<AroEntity> getEntities() ;
	
}
