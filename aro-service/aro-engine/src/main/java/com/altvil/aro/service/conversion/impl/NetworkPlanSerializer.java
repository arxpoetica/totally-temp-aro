package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler.EquipmentResolver;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class NetworkPlanSerializer<T> {

	private long planId;
	private EquipmentResolver equipmentResolver ;
	
	public NetworkPlanSerializer(EquipmentResolver equipmentResolver, long planId) {
		super();
		this.equipmentResolver = equipmentResolver ;
		this.planId = planId;
	}
	
	

	public PlanModifications<T> serialize(CompositeNetworkModel compositeModel,
			PlanModifications<T> planMods) {

		compositeModel
				.getNetworkModels()
				.forEach(
						model -> {

							EquipmentSerializer equipmentSerializer = new EquipmentSerializer(
									planId);
							equipmentSerializer.serialize(model
									.getFiberSourceMapping());
							equipmentSerializer.commit(a -> planMods.addEquipment(a.assemble(planId, equipmentResolver)));
							planMods.setLocationDemand(equipmentSerializer.getLocationDemand()) ;

							FiberRouteSerializer fibererSerializer = new FiberRouteSerializer(
									planId, model, equipmentSerializer
											.getMapping());
							fibererSerializer.serialize(model
									.getFiberSourceMapping());
							fibererSerializer.commit(planMods::addFiber);
							planMods.setFiberLengths(fibererSerializer.getFiberLengthMap()) ;

						});

		return planMods ;

	}

}