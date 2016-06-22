package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.optimize.spi.PricingContext;

public interface MaterialAssigment {

	public double getCost(PricingContext ctx, FiberConsumer fiberConsumer, FiberProducer fiberProducer,  DemandCoverage coverage);

}
