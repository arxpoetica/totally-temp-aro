package com.altvil.aro.service.conversion.impl;

import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.NetworkPlanDataKey;
import com.altvil.aro.model.PlanLocationLink;
import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler.EquipmentResolver;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.utils.StreamUtil;

public class NetworkPlanSerializer<T> {

	private long planId;
	private EquipmentResolver equipmentResolver;

	public NetworkPlanSerializer(EquipmentResolver equipmentResolver,
			long planId) {
		super();
		this.equipmentResolver = equipmentResolver;
		this.planId = planId;
	}

	public PlanModifications<T> serialize(PlannedNetwork planNetwork,
			PlanModifications<T> planMods) {

		planNetwork
				.getPlannedNetwork()
				.getNetworkModels()
				.forEach(
						model -> {

							EquipmentSerializer equipmentSerializer = new EquipmentSerializer(
									planId);
							equipmentSerializer.serialize(model
									.getFiberSourceMapping());
							equipmentSerializer.commit(a -> planMods
									.addEquipment(a.assemble(planId,
											equipmentResolver)));
							planMods.setEquipmentLocationMappings(equipmentSerializer
									.getEquipmentLocationMappings());
							planMods.setDemandCoverage(equipmentSerializer
									.getDemandCoverage());
							FiberRouteSerializer fibererSerializer = new FiberRouteSerializer(
									planId, model, equipmentSerializer
											.getMapping());
							fibererSerializer.serialize(model
									.getFiberSourceMapping());
							fibererSerializer.commit(planMods::addFiber);
							planMods.setFiberLengths(fibererSerializer
									.getFiberLengthMap());

						});

		if (planNetwork.getGeneratedData() != null) {
			planMods.addLocationLinks(StreamUtil.map(planNetwork
					.getGeneratedData().getLinkedLocations(), ll -> {
				PlanLocationLink pl = new PlanLocationLink();
				DemandStatistic ds = ll.getDemandStatistic();

				pl.setPlanId(planId);
				pl.setLocationId(ll.getLocationId());
				pl.setAttribute(ll.getExtendedInfo());
				pl.setLinkingState(ll.getLinkType().ordinal());
				pl.setState("66"); // TODO derive STATE
					pl.setEntityTypeId(ll.getLocationEntityType().getTypeCode());

					pl.setAtomicUnits(ds.getAtomicUnits());
					pl.setFairShareDemand(ds.getFairShareDemand());
					pl.setMonthlyRevenueImpact(ds.getMonthlyRevenueImpact());
					pl.setPenetration(ds.getPenetration());
					pl.setRawCoverage(ds.getRawCoverage());
					pl.setTotalRevenue(ds.getTotalRevenue());

					return pl;

				}));

			StreamUtil.map(
					planNetwork.getGeneratedData().getGeneratedNetworkData(),
					d -> {
						NetworkPlanData pd = new NetworkPlanData();
						pd.setId(new NetworkPlanDataKey(
								planNetwork.getPlanId(), d.getId()));
						pd.setGeometry(d.getGeometry());
						return pd;
					}).forEach(planData -> {
				planMods.addNetworkPlanData(planData);
			});
			;

		}

		return planMods;

	}

}