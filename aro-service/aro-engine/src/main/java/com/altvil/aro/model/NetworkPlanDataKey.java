package com.altvil.aro.model;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@SuppressWarnings("serial")
@Embeddable
public class NetworkPlanDataKey implements Serializable {

	private long planId;
	private String key;

	public NetworkPlanDataKey() {}

	public NetworkPlanDataKey(long planId, String key) {
		super();
		this.planId = planId;
		this.key = key;
	}

	@Column(name = "network_plan_id")
	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	@Column(name = "data_key")
	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

}
