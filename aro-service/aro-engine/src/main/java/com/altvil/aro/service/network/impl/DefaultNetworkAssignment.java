package com.altvil.aro.service.network.impl;

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
	
}
