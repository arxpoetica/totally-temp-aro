package com.altvil.aro.service.entity.impl;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.AroEntityVisitor;
import com.altvil.aro.service.entity.ConsumerAggregate;

public class DefaultConsumerEntity extends AbstractEntity implements
		ConsumerAggregate {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private int houseHoldCount;

	public DefaultConsumerEntity(Long id, int houseHoldCount) {
		super(id);
		this.houseHoldCount = houseHoldCount;
	}

	@Override
	public int getHouseHoldCount() {
		return houseHoldCount;
	}

	@Override
	public Class<? extends AroEntity> getType() {
		return ConsumerAggregate.class;
	}

	@Override
	public void accept(AroEntityVisitor visitor) {
		visitor.visit(this);
	}
	
	

}
