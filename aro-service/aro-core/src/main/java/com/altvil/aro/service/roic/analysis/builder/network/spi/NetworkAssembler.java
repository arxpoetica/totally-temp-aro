package com.altvil.aro.service.roic.analysis.builder.network.spi;

import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;

public interface NetworkAssembler {

	public abstract void assemble();

	public abstract RoicNetworkModel build();

}