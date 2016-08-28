package com.altvil.aro.service.plan.impl;

import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService.LcrContext;
import com.altvil.aro.service.price.PricingModel;

public class LcrContextImpl implements LcrContext {

	public static LcrContext create(PricingModel pricingModel, FtthThreshholds threshholds) {
		return new LcrContextImpl(pricingModel, threshholds, ScalarClosestFirstSurfaceIterator.BUILDER) ;
	}
	
	public static LcrContext create(PricingModel pricingModel, FtthThreshholds threshholds,ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		return new LcrContextImpl(pricingModel, threshholds, closestFirstSurfaceBuilder) ;
	}
	
	private PricingModel pricingModel;
	private FtthThreshholds threshholds;
	private ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder;

	private LcrContextImpl(PricingModel pricingModel,
			FtthThreshholds threshholds,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		super();
		this.pricingModel = pricingModel;
		this.threshholds = threshholds;
		this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
	}

	@Override
	public PricingModel getPricingModel() {
		return pricingModel;
	}

	@Override
	public FtthThreshholds getFtthThreshholds() {
		return threshholds;
	}

	@Override
	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceBuilder() {
		return closestFirstSurfaceBuilder;
	}

}
