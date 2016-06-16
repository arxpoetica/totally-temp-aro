package com.altvil.aro.service.roic.analysis.builder;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public class RoicInputs {

	private NetworkAnalysisType type ;
	private Collection<ComponentInput> componentInputs ;
	private double fixedCost ;
	
	public NetworkAnalysisType getType() {
		return type;
	}

	public void setType(NetworkAnalysisType type) {
		this.type = type;
	}

	public double getFixedCost() {
		return fixedCost;
	}

	public void setFixedCost(double fixedCost) {
		this.fixedCost = fixedCost;
	}

	public Collection<ComponentInput> getComponentInputs() {
		return componentInputs;
	}

	public void setComponentInputs(Collection<ComponentInput> componentInputs) {
		this.componentInputs = componentInputs;
	}
	
	
	
}
