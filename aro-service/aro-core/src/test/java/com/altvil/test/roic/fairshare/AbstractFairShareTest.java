package com.altvil.test.roic.fairshare;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.NetworkTypeShare;
import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;
import com.altvil.aro.service.roic.provider.impl.DefaultNetworkCapability;

public class AbstractFairShareTest {

	protected static NetworkType[] mapping = new NetworkType[] {
			NetworkType.Copper, NetworkType.Fiber };

	
	protected NetworkCapability createCapability(double[] networkStrengths,
			int[] config) {

		EnumSet<NetworkType> types = EnumSet.noneOf(NetworkType.class);
		for (int i = 0; i < config.length; i++) {
			if (config[i] != 0) {
				types.add(mapping[i]);
			}
		}

		Map<NetworkType, Double> strengthMap = new EnumMap<>(NetworkType.class);
		int index = 0;
		for (double v : networkStrengths) {
			strengthMap.put(mapping[index++], v);
		}
		for (; index < mapping.length; ) {
			strengthMap.put(mapping[index++], 1.0);
		}

		return new DefaultNetworkCapability(new NetworkProvider() {
		}, strengthMap, types);

	}


	protected FairShareInputs createInputs(double copper, double fiber,
			int[][] inputs, double[] prodStrengths) {
		
		double[][] strengths = new double[prodStrengths.length][mapping.length] ;
		
		for(int r=0 ; r<inputs.length ; r++) {
			double strength = prodStrengths[r] ;
			for(int c=0 ; c<mapping.length ; c++) {
				strengths[r][c] = strength;
			}
		}
		return createInputs(copper, fiber, inputs, strengths);
	}

	protected FairShareInputs createInputs(double copper, double fiber,
			int[][] inputs, double[][] prodStrength) {

		FairShareInputs.Builder b = FairShareInputs.build().setNetworkTypes(
				NetworkTypeShare.build().add(NetworkType.Copper, copper)
						.add(NetworkType.Fiber, fiber).build());

		b.setDemographicModifier(1.0);

		b.setProvider(createCapability(prodStrength[0], inputs[0]));
		for (int i = 1; i < inputs.length; i++) {
			b.addCompetitor(createCapability(prodStrength[i], inputs[i]));
		}

		return b.build();

	}

}
