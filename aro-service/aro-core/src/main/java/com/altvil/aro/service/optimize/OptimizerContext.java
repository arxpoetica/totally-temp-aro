package com.altvil.aro.service.optimize;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

import java.util.function.Supplier;

public class OptimizerContext {

	private boolean fullAnalysisNode;
	private PricingModel pricingModel;
	private FiberNetworkConstraints fiberConstraints;
	private FtthThreshholds ftpThreshholds ;
	private Supplier<LocationDemand> coverageScoreSupplier;

	public OptimizerContext(boolean fullAnalysisNode,
							PricingModel pricingModel, 
							FtthThreshholds ftpThreshholds,
							FiberNetworkConstraints fiberConstraints, Supplier<LocationDemand> scoreSupplier) {
		super();
		this.fullAnalysisNode = fullAnalysisNode;
		this.pricingModel = pricingModel;
		this.fiberConstraints = fiberConstraints;
		this.ftpThreshholds = ftpThreshholds ;
		this.coverageScoreSupplier = scoreSupplier;
	}

	public boolean isFullAnalysisModel() {
		return fullAnalysisNode;
	}

	public PricingModel getPricingModel() {
		return pricingModel;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberConstraints;
	}

	public Supplier<LocationDemand> getCoverageScoreSupplier() {
		return coverageScoreSupplier;
	}

	public FtthThreshholds getFtpThreshholds() {
		return ftpThreshholds;
	}
	
	

}
