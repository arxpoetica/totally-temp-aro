package com.altvil.aro.service.conversion.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler.EquipmentResolver;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

@Service("serializationService")
public class ConversionServiceImpl implements SerializationService {

	private final NetworkNodeRepository networkNodeRepository ;
	private final EquipmentResolver resolver ;
	
	
	@Autowired
	public ConversionServiceImpl(NetworkNodeRepository networkNodeRepository) {
		super();
		this.networkNodeRepository = networkNodeRepository;
		this.resolver = createResolver() ;
	}
	
	private EquipmentResolver createResolver() {
		return new EquipmentResolver() {
			@Override
			public NetworkNode getCentralOffice(long planId) {
				List<NetworkNode> result = networkNodeRepository.findEquipment(NetworkNodeType.central_office.getId(), planId) ;
				return result.size() == 0 ? null : result.get(0);
			}
		};
	}
	

	@Override
	public WirecenterNetworkPlan convert(long planId,
			Optional<CompositeNetworkModel> model) {

		WireCenterMods mods = new WireCenterMods(planId);

		if (model.isPresent()) {
			new NetworkPlanSerializer<WirecenterNetworkPlan>(resolver, planId).serialize(
					model.get(), mods);
		}

		return mods.commit();
	}

}
