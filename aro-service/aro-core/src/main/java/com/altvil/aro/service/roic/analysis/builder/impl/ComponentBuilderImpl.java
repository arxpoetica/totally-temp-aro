package com.altvil.aro.service.roic.analysis.builder.impl;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.spi.StreamAssembler;

public class ComponentBuilderImpl implements ComponentBuilder {

	private AnalysisService analysisService;

	private StreamAssembler roicAssembler;

	private ComponentType componentType = ComponentType.undefined;
	private ComponentInput inputs;
	private AnalysisPeriod analysisPeriod;

	public ComponentBuilderImpl(AnalysisService analysisService) {
		super();
		this.analysisService = analysisService;
		roicAssembler = new StreamAssemblerImpl();
	}

	@Override
	public ComponentBuilder setAnalysisPeriod(AnalysisPeriod period) {
		roicAssembler.setAnalysisPeriod(analysisPeriod = period);
		return this;
	}

	@Override
	public ComponentBuilder setRoicModelInputs(ComponentInput inputs) {
		this.inputs = inputs;
		return this;
	}

	@Override
	public ComponentBuilder setComponentType(ComponentType type) {
		this.componentType = type;
		return this;
	}

	@Override
	public RoicComponent build() {

		assemble(inputs);
		assignOutputs();

		return new ComponentModelImpl(analysisPeriod, componentType,
				roicAssembler.resolveAndBuild());

	}

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%

	private void assignOutputs() {
		roicAssembler
				.addOutput(AnalysisCode.penetration)
				.addOutput(AnalysisCode.revenue)
				.addOutput(AnalysisCode.premises_passed)
				.addOutput(AnalysisCode.subscribers_count)
				.addOutput(AnalysisCode.subscribers_penetration)
				.addOutput(AnalysisCode.new_connections)
				.addOutput(AnalysisCode.opex_expenses)
				.addOutput(AnalysisCode.new_connections_period);
	}

	private void assemble(ComponentInput inputs) {
		roicAssembler.add(AnalysisCode.penetration,
				analysisService.createCurve(inputs.getPenetration()));

		roicAssembler.add(AnalysisCode.premises_passed,
				analysisService.createPremisesPassed(inputs.getEntityCount()));

		roicAssembler.add(AnalysisCode.subscribers_count, analysisService
				.createMultiplyOp(AnalysisCode.penetration,
						inputs.getEntityCount()));

		roicAssembler
				.add(AnalysisCode.subscribers_penetration, analysisService
						.createMultiplyOp(AnalysisCode.penetration, 1.0));
		

		roicAssembler.add(AnalysisCode.houseHolds, analysisService
				.createHouseHolds(inputs.getEntityCount(),
						inputs.getEntityGrowth()));
		
		

		roicAssembler.add(AnalysisCode.revenue, analysisService.createRevenue(
				AnalysisCode.houseHolds, AnalysisCode.penetration,
				AnalysisCode.arpu));

		roicAssembler.add(AnalysisCode.new_connections, analysisService
				.createConnectedHouseHolds(inputs.getPenetration().getRate(),
						inputs.getEntityCount(), inputs.getChurnRate(),
						inputs.getChurnRateDecrease()));
		
		roicAssembler.add(AnalysisCode.new_connections_count, 
				analysisService.createMultiplyOp(AnalysisCode.houseHolds, AnalysisCode.new_connections)) ;
			
		roicAssembler.add(AnalysisCode.new_connections_period, 
				analysisService.createStreamDiff(AnalysisCode.new_connections_count)) ;
		

		roicAssembler.add(AnalysisCode.arpu,
				analysisService.createARPU(inputs.getArpu()));

		roicAssembler.add(
				AnalysisCode.opex_expenses,
				analysisService.createMultiplyOp(AnalysisCode.revenue,
						inputs.getOpexPercent()));

	}

}
