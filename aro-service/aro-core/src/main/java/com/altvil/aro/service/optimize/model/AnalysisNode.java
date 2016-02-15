package com.altvil.aro.service.optimize.model;

public interface AnalysisNode {

	DemandCoverage getFiberCoverage();

	double getCapex();

	double getSuccessBasedCapex();

	/**
	 * The higher the better
	 */
	double getScore();

}
