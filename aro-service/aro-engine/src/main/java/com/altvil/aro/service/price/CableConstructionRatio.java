package com.altvil.aro.service.price;

import com.altvil.interfaces.CableConstructionEnum;

public class CableConstructionRatio {
	
	private CableConstructionEnum type;
	private double ratio;
	
	public CableConstructionRatio() {
	}
	
	public CableConstructionRatio(CableConstructionEnum type, double ratio) {
		super();
		this.type = type;
		this.ratio = ratio;
	}

	public CableConstructionEnum getType() {
		return type;
	}

	public void setType(CableConstructionEnum type) {
		this.type = type;
	}

	public double getRatio() {
		return ratio;
	}

	public void setRatio(double ratio) {
		this.ratio = ratio;
	}


}
