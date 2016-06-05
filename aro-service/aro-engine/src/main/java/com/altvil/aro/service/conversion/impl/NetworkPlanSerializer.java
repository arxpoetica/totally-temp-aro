package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class NetworkPlanSerializer<T> {

	private long planId;
	
	public NetworkPlanSerializer(long planId) {
		super();
		this.planId = planId;
	}

	public T serialize(CompositeNetworkModel compositeModel,
			PlanModifications<T> planMods) {

		compositeModel
				.getNetworkModels()
				.forEach(
						model -> {

							EquipmentSerializer equipmentSerializer = new EquipmentSerializer(
									planId);
							equipmentSerializer.serialize(model
									.getFiberSourceMapping());
							equipmentSerializer.commit(planMods::addEquipment);
							planMods.setLocationDemand(equipmentSerializer.getLocationDemand()) ;

							FiberRouteSerializer fibererSerializer = new FiberRouteSerializer(
									planId, model, equipmentSerializer
											.getMapping());
							fibererSerializer.serialize(model
									.getFiberSourceMapping());
							fibererSerializer.commit(planMods::addFiber);
							planMods.setFiberLengths(fibererSerializer.getFiberLengthMap()) ;

						});

		return planMods.commit();

	}

}