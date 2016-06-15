package com.altvil.aro.service.roic.impl;

import java.util.Collections;
import java.util.Map;

import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicServiceImpl implements RoicService {

	private Map<NetworkType, RoicInputs> map ;
	private AnalysisService analysisService;
	private NetworkPlanRepository planRepostory ;
	private NetworkNodeRepository NetworkNodeRepository ;
	
	@Override
	public RoicModel getMasterRoicModel(long planId) {
		return null;
	}

	@Override
	public RoicModel getWirecenterRoicModel(long planId) {
	
		return null;
	}
	
	private LocationDemand getLocationDemand(long plan) {
		return null ;
	}
	
	private double getCapex(int plan) {
		return 20000 ;
	}

	private RoicInputs initCopper() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.copper);

		ComponentInput ci = ComponentInput
				.build()
				.setArpu(40.61)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.3, 0.15,
								-0.019069912331085))
				.setChurnRateDecrease(0.027).setOpexPercent(0.5)
				.setMaintenanceExpenses(0.0423).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri ;
	}
	
	private RoicInputs initFiber() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.fiber);

		ComponentInput ci = ComponentInput
				.build()
				.setArpu(40.61)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.3, 0.15,
								-0.019069912331085))
				.setChurnRateDecrease(0.027).setOpexPercent(0.5)
				.setMaintenanceExpenses(0.0423).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri ;

	}

}
