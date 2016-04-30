package com.altvil.aro.service.roic.fairshare.impl;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.calc.CalcRow;
import com.altvil.utils.calc.CalcSheet;

public class DefaultFairShareModelFactory implements FairShareModelFactory {

	@Override
	public FairShareModel createModel(FairShareInputs inputs) {

		CalcSheet<NetworkType> calcSheet = new CalcSheet<>(inputs
				.getNetworkTypeShare().getNetworkTypes());

		final CalcRow<NetworkType, Double> networkSupply = calcSheet
				.calcDouble(t -> {
					return inputs.getCompetitorNetworkCapabilities().stream()
							.mapToDouble(c -> c.getEffectiveNetworkStrength(t)).sum()
							+ inputs.getProviderCapability()
									.getEffectiveNetworkStrength(t);

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

					// effectiveUtilization --Normalize Network based on
					// "active networks"
					// FairShareByType = (provider_strength / total_strength )
					// Effective Demand = FairShareByType * effectiveUtilization
					return ((inputs.getProviderCapability().getEffectiveNetworkStrength(
							t) / networkSupply.getValue(t)))
							* (networkUtilization.getValue(t) / totalUtilization);

				});

		return new DefaultFairShareModel(FairShareModelTypeEnum.StandardModel,
				inputs.getNetworkTypeShare(), fairShare);
	}

}
