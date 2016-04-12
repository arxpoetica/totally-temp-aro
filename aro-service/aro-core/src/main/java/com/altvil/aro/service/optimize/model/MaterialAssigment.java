package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.optimize.spi.AnalysisContext;

public interface MaterialAssigment {

	public double getCost(AnalysisContext ctx, FiberConsumer fiberConsumer, FiberProducer fiberProducer,  DemandCoverage coverage);

}
