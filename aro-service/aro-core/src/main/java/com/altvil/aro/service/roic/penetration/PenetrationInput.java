package com.altvil.aro.service.roic.penetration;

import com.altvil.aro.service.roic.model.NetworkType;

public class PenetrationInput {

	private NetworkType networkType;
	private int analysisMonths;
	private double pentrationAdjustmentFactor;

	private double startShare;
	private double endShare;

	public NetworkType getNetworkType() {
		return networkType;
	}

	public void setNetworkType(NetworkType networkType) {
		this.networkType = networkType;
	}

	public int getAnalysisMonths() {
		return analysisMonths;
	}

	public void setAnalysisMonths(int analysisMonths) {
		this.analysisMonths = analysisMonths;
	}

	public double getPentrationAdjustmentFactor() {
		return pentrationAdjustmentFactor;
	}

	public void setPentrationAdjustmentFactor(double pentrationAdjustmentFactor) {
		this.pentrationAdjustmentFactor = pentrationAdjustmentFactor;
	}

	public double getStartShare() {
		return startShare;
	}

	public void setStartShare(double startShare) {
		this.startShare = startShare;
	}

	public double getEndShare() {
		return endShare;
	}

	public void setEndShare(double endShare) {
		this.endShare = endShare;
	}

}
