package com.altvil.aro.service.optimize;

import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

import java.util.function.Supplier;

public class OptimizerContext {

	private boolean fullAnalysisNode;
	private PricingModel pricingModel;
	private FiberNetworkConstraints fiberConstraints;
	private FtthThreshholds ftpThreshholds ;
	private Supplier<CoverageAggregateStatistic> coverageScoreSupplier;

	public OptimizerContext(boolean fullAnalysisNode,
							PricingModel pricingModel, 
							FtthThreshholds ftpThreshholds,
							FiberNetworkConstraints fiberConstraints, Supplier<CoverageAggregateStatistic> scoreSupplier) {
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

	public Supplier<CoverageAggregateStatistic> getCoverageScoreSupplier() {
		return coverageScoreSupplier;
	}

	public FtthThreshholds getFtpThreshholds() {
		return ftpThreshholds;
	}
	
	

}
