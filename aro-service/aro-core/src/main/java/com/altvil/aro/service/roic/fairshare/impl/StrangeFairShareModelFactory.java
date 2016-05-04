package com.altvil.aro.service.roic.fairshare.impl;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.calc.CalcRow;
import com.altvil.utils.calc.CalcSheet;

public class StrangeFairShareModelFactory implements FairShareModelFactory {

	private NetworkType dominentType = NetworkType.Fiber;
	private NetworkType legacyType = NetworkType.Copper;

	private double divide(double a, double b) {
		return b == 0 ? 0 : a / b;
	}

	@Override
	public FairShareModel createModel(FairShareInputs inputs) {

		CalcSheet<NetworkType> calcSheet = new CalcSheet<>(inputs
				.getNetworkTypeShare().getNetworkTypes());

		// Sum up all weights
		final CalcRow<NetworkType, Double> networkSupply = calcSheet
				.calcDouble(t -> {
					return inputs.getCompetitorNetworkCapabilities().stream()
							.mapToDouble(c -> c.getEffectiveNetworkStrength(t))
							.sum()
							+ inputs.getProviderCapability()
									.getEffectiveNetworkStrength(t);
				});

		// Compute fair share by type
		final CalcRow<NetworkType, Double> fairShareByType = calcSheet
				.calcDouble(t -> divide(inputs.getProviderCapability()
						.getEffectiveNetworkStrength(t), networkSupply
						.getValue(t)));

		double dominantShareByType = fairShareByType.getValue(dominentType);
		boolean dominantHasValue = (dominantShareByType == 0);

		// Compute legacy Share Market as a function of Dominant Share of Market
		// (A little twisted);
		double legacyMkt = dominantHasValue ? 1 : inputs
				.getProviderCapability()
				.getEffectiveNetworkStrength(legacyType) == 0 ? 0 : inputs
				.getNetworkTypeShare().getValue(legacyType);

		// Ensure legacy + dominant = 1 ;
		double dominantMkt = 1 - legacyMkt;
	
		calcSheet.calcDouble(t -> {
			if (t == dominentType) {
				//Normal FairShareByType adjustment
				return fairShareByType.getValue(dominentType) * dominantMkt;
			}
			if (t == legacyType) {
				//Now things get crazy and legacyFairShare is modified by dominant share and adjusted for Market size
				return ((dominantHasValue) ? fairShareByType
						.getValue(dominentType) : fairShareByType
						.getValue(legacyType))
						* legacyMkt;
			}

			return 0.0 ;
		});

		
		final CalcRow<NetworkType, Double> networkUtilization = calcSheet
				.calcDouble(t -> {
					return networkSupply.getValue(t) == 0 ? 0 : inputs
							.getNetworkTypeShare().getValue(t);
				});

		final double totalUtilization = networkUtilization.getTotal();

		final CalcRow<NetworkType, Double> fairShare = calcSheet
				.calcDouble(t -> {

					if (networkSupply.getValue(t) == 0 || totalUtilization == 0) {
						return 0.0;
					}

					// 1 / (1 + 0.5*(competitors))

					// effectiveUtilization --Normalize Network based on
					// "active networks"
					// FairShareByType = (provider_strength / total_strength )
					// Effective Demand = FairShareByType * effectiveUtilization
					return ((inputs.getProviderCapability()
							.getEffectiveNetworkStrength(t) / networkSupply
							.getValue(t)))
							* (networkUtilization.getValue(t) / totalUtilization);

				});

		return new DefaultFairShareModel(FairShareModelTypeEnum.StandardModel,
				inputs.getNetworkTypeShare(), fairShare);
	}
	
	@Override
	public ModelType getModelType() {
		return FairShareModelTypeEnum.AltvilModel ;
	}

}
