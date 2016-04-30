package com.altvil.aro.service.roic.fairshare.impl;

import java.util.Set;

import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.NetworkTypeShare;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.calc.CalcRow;

public class DefaultFairShareModel implements FairShareModel {

	private ModelType modelType;
	private final NetworkTypeShare networkTypeShare;
	private final CalcRow<NetworkType, Double> fairShareRow;

	public DefaultFairShareModel(ModelType modelType,
			NetworkTypeShare networkTypeShare,
			CalcRow<NetworkType, Double> fairShareRow) {
		super();
		this.modelType = modelType;
		this.networkTypeShare = networkTypeShare;
		this.fairShareRow = fairShareRow;
	}

	@Override
	public ModelType getModelType() {
		return modelType;
	}

	@Override
	public Set<NetworkType> getNetworkTypes() {
		return networkTypeShare.getNetworkTypes();
	}

	@Override
	public double getTotalShare() {
		return fairShareRow.getTotal();
	}

	@Override
	public double getShare(NetworkType type) {
		return fairShareRow.getValue(type);
	}

}
