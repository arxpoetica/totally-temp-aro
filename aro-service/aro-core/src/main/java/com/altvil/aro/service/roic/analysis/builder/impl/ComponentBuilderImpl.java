package com.altvil.aro.service.roic.analysis.builder.impl;

import com.altvil.aro.service.roic.analysis.AnalysisCode;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.entity.ComponentModel.EntityAnalysisType;
import com.altvil.aro.service.roic.analysis.spi.StreamAssembler;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class ComponentBuilderImpl implements ComponentBuilder {

	private NetworkType networkType;
	private EntityAnalysisType entityAnalysisType;

	private StreamAssembler roicAssembler;
	private AnalysisService analysisService;

	private NetworkPenetration penetration;
	private double entityCount = 1;
	private double entityGrowth = 0;
	private double churnRate = 0;
	private double churnRateDecrease = 0;
	private double opexPercent;
	private double arpu;

	@Override
	public ComponentBuilder setNetworkPenetration(
			NetworkPenetration penetration) {
		roicAssembler.add(AnalysisCode.penetration,
				analysisService.createCurve(penetration));
		return this;
	}

	@Override
	public ComponentBuilder setEntityCount(double startCount) {
		this.entityCount = startCount;
		return this;
	}

	@Override
	public ComponentBuilder setEntityGrowth(double growth) {
		this.entityGrowth = growth;
		return this;
	}

	@Override
	public ComponentBuilder setChurnRate(double churnRate) {
		this.churnRate = churnRate;
		return this;
	}

	@Override
	public ComponentBuilder setChurnRateDecrease(double churnRateDecrease) {
		this.churnRateDecrease = churnRateDecrease;
		return this;
	}

	@Override
	public ComponentBuilder setNetworkPenetration(double start,
			double end, double rate) {
		return setNetworkPenetration(new DefaultNetworkPenetration(start, end,
				rate));
	}

	@Override
	public ComponentBuilder setArpu(double arpu) {
		roicAssembler.add(AnalysisCode.arpu, analysisService.createARPU(arpu));
		return this;
	}

	@Override
	public ComponentBuilder setOpEx(double percent) {
		roicAssembler
				.add(AnalysisCode.houseHolds, analysisService.createMultiplyOp(
						AnalysisCode.revenue, percent));
		return this;
	}

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%

	@Override
	public NetworkAnalysisBuilder resolve() {
		
		roicAssembler.add(AnalysisCode.penetration, analysisService
				.createCurve(this.penetration));
		
		roicAssembler.add(AnalysisCode.houseHolds, analysisService
				.createHouseHolds(entityCount, this.entityGrowth));

		roicAssembler.add(AnalysisCode.revenue, analysisService.createRevenue(
				AnalysisCode.revenue, AnalysisCode.penetration,
				AnalysisCode.houseHolds));

		roicAssembler.add(AnalysisCode.new_connections, analysisService
				.createConnectedHouseHolds(penetration.getRate(),
						this.entityCount, churnRate, this.churnRateDecrease));

		roicAssembler.add(AnalysisCode.arpu, analysisService.createARPU(arpu));

		roicAssembler.add(AnalysisCode.houseHolds, analysisService
				.createMultiplyOp(AnalysisCode.revenue, opexPercent));

		

		return null;
	}

}
