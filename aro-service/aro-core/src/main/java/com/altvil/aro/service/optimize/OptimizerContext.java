package com.altvil.aro.service.optimize;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class OptimizerContext {

	private boolean fullAnalysisNode;
	private PricingModel pricingModel;
	private FiberNetworkConstraints fiberConstraints;
	private FtthThreshholds ftpThreshholds ;
	
	public OptimizerContext(boolean fullAnalysisNode,
							PricingModel pricingModel, 
							FtthThreshholds ftpThreshholds,
							FiberNetworkConstraints fiberConstraints) {
		super();
		this.fullAnalysisNode = fullAnalysisNode;
		this.pricingModel = pricingModel;
		this.fiberConstraints = fiberConstraints;
		this.ftpThreshholds = ftpThreshholds ;
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

	
	public FtthThreshholds getFtpThreshholds() {
		return ftpThreshholds;
	}
	
	

}
