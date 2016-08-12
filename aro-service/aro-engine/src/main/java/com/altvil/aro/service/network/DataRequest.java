package com.altvil.aro.service.network;

public class DataRequest {

	private Integer wireCenterId;
	private Long planId;
	
	public DataRequest(Integer wireCenterId, Long planId) {
		super();
		this.wireCenterId = wireCenterId;
		this.planId = planId;
	}

	public Integer getWireCenterId() {
		return wireCenterId;
	}

	public Long getPlanId() {
		return planId;
	}

}
