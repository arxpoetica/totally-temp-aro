package com.altvil.aro.service.roic.analysis.builder.network;

import java.util.Collection;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public class RoicInputs {

	public static RoicInputs updateInputs(RoicInputs inputs,
			double totalDemand, double cost) {

		RoicInputs result = new RoicInputs();
		result.setFixedCost(cost);
		result.setType(inputs.getType());

		result.setComponentInputs(inputs.getComponentInputs().stream()
				.map(ci -> {
					return ci.clone().setEntityCount(totalDemand).assemble();
				}).collect(Collectors.toList()));

		return result;

	}

	private NetworkAnalysisType type;
	private Collection<ComponentInput> componentInputs;
	private double fixedCost;

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
