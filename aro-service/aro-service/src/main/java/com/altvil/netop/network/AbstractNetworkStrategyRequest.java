package com.altvil.netop.network;

import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.netop.network.algorithms.NpvSetupRequest;
import com.altvil.netop.network.algorithms.ScalarSetupRequest;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonIgnoreProperties(ignoreUnknown=true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include=JsonTypeInfo.As.PROPERTY)
@JsonSubTypes({
	@JsonSubTypes.Type(value = NpvSetupRequest.class, name="NPV"),
	@JsonSubTypes.Type(value = ScalarSetupRequest.class, name="scalar")
})
public abstract class AbstractNetworkStrategyRequest implements NetworkStrategyRequest {
}
