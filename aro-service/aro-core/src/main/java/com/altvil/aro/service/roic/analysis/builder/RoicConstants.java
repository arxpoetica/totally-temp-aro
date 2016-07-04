package com.altvil.aro.service.roic.analysis.builder;

import java.util.Collections;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicConstants {
	
	public static final RoicInputs CopperInputs = initCopper() ;
	public static final RoicInputs FiberConstants = initFiber() ;
	
	
	
	private static  RoicInputs initCopper() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.copper);

		ComponentInput ci = ComponentInput
				.build()
				.setComponentType(ComponentType.household)
				.setArpu(487.26)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.3, 0.15,
								-0.2062994740159)).setChurnRate(0.28)
				.setChurnRateDecrease(0.027).setEntityGrowth(0.01)
				.setOpexPercent(0.5).setMaintenanceExpenses(0.0423).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri;
	}

	private static RoicInputs initFiber() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.fiber);

		ComponentInput ci = ComponentInput
				.build()
				.setComponentType(ComponentType.household)
				.setArpu(1898.7264)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.0, 0.5, -.25))
				.setEntityGrowth(0.01)
				.setChurnRate(0.2056)
				.setChurnRateDecrease(0.0)
				.setOpexPercent(0.4).setMaintenanceExpenses(0.0423)
				.setEntityGrowth(0.01).setConnectionCost(204.0).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri;

	}
	

}
