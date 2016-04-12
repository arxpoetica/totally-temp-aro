package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.model.FiberProducer;

public class DefaultFiberProducer implements FiberProducer {

	private FiberType fiberType ;
	private int fiberCount ;
	
	public DefaultFiberProducer(FiberType fiberType, int fiberCount) {
		super();
		this.fiberType = fiberType;
		this.fiberCount = fiberCount;
	}

	@Override
	public FiberType getFiberType() {
		return fiberType;
	}

	@Override
	public int getFiberCount() {
		return  fiberCount ;
	}

}
