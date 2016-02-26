package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.plan.CompositeNetworkModel;

public class NetworkPlanSerializer<T> {

	private int planId;
	
	public NetworkPlanSerializer(int planId) {
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

							FiberRouteSerializer fibererSerializer = new FiberRouteSerializer(
									planId, model, equipmentSerializer
											.getMapping());
							fibererSerializer.serialize(model
									.getFiberSourceMapping());
							fibererSerializer.commit(planMods::addFiber);

						});

		return planMods.commit();

	}

}