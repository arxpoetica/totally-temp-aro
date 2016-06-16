package com.altvil.aro.service.network.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadLocation;

public class DefaultNetworkAssignment implements NetworkAssignment {

	private AroEntity source ;
	private RoadLocation domain ;
	
	public DefaultNetworkAssignment(AroEntity source, RoadLocation domain) {
		super();
		this.source = source;
		this.domain = domain;
	}

	@Override
	public AroEntity getSource() {
		return source ;
	}

	@Override
	public RoadLocation getDomain() {
		return domain ;
	}

	@Override
	public Long getRoadSegmentId() {
		return domain.getRoadSegmentId() ;
	}
	
	public String toString() {
		return ToStringBuilder.reflectionToString(this);
	}	
}
