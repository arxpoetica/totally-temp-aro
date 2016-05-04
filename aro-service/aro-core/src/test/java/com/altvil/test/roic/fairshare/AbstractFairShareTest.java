package com.altvil.test.roic.fairshare;

import java.util.EnumSet;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.NetworkTypeShare;
import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;
import com.altvil.aro.service.roic.provider.impl.DefaultNetworkCapability;

public class AbstractFairShareTest {

	protected static NetworkType[] mapping = new NetworkType[] {
			NetworkType.Copper, NetworkType.Fiber, NetworkType.FiveG };

	protected NetworkCapability createCapability(double strength, int[] config) {

		EnumSet<NetworkType> types = EnumSet.noneOf(NetworkType.class);
		for (int i = 0; i < config.length; i++) {
			if (config[i] != 0) {
				types.add(mapping[i]);
			}
		}

		return new DefaultNetworkCapability(new NetworkProvider() {
		}, strength, types);

	}
	
	protected FairShareInputs createInputs(double copper, double fiber,
			int[][] inputs, double[] prodStrength) {
		return createInputs(copper, fiber, inputs, prodStrength, 1.0) ;
	}

	protected FairShareInputs createInputs(double copper, double fiber,
			int[][] inputs, double[] prodStrength, double demographicModifier) {

		FairShareInputs.Builder b = FairShareInputs.build().setNetworkTypes(
				NetworkTypeShare.build().add(NetworkType.Copper, copper)
						.add(NetworkType.Fiber, fiber).build());
		
		b.setDemographicModifier(demographicModifier) ;

		b.setProvider(createCapability(prodStrength[0], inputs[0]));
		for (int i = 1; i < inputs.length; i++) {
			b.addCompetitor(createCapability(prodStrength[i], inputs[i]));
		}

		return b.build();

	}

}
