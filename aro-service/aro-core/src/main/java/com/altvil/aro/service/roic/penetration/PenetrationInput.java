package com.altvil.aro.service.roic.penetration;

import com.altvil.aro.service.roic.model.NetworkType;

public class PenetrationInput {

	private double penetrationAdjustmentFactor;

	private double startShare;
	private double endShare;
	private double rate;

	
	public double getRate() {
		return rate;
	}

	public void setRate(double rate) {
		this.rate = rate;
	}
	

	public double getPenetrationAdjustmentFactor() {
		return penetrationAdjustmentFactor;
	}

	public void setPenetrationAdjustmentFactor(double penetrationAdjustmentFactor) {
		this.penetrationAdjustmentFactor = penetrationAdjustmentFactor;
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
