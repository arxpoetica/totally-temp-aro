package com.altvil.aro.service.conversion.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

@Service
public class ConversionServiceImpl implements SerializationService {

	@Override
	public WirecenterNetworkPlan convert(int planId,
			Optional<CompositeNetworkModel> model) {

		WireCenterMods mods = new WireCenterMods(planId);

		if (model.isPresent()) {
			new NetworkPlanSerializer<WirecenterNetworkPlan>(planId).serialize(
					model.get(), mods);
		}

		return mods.commit();
	}

}
