package com.altvil.aro.model;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Entity
@DiscriminatorValue("W")
public class WirecenterPlan extends NetworkPlan {

	private MasterPlan masterPlan;
	private ProcessArea wireCenter;

	@ManyToOne
	@JoinColumn(name = "parent_plan_id", nullable = false)
	public MasterPlan getMasterPlan() {
		return masterPlan;
	}

	public void setMasterPlan(MasterPlan masterPlan) {
		this.masterPlan = masterPlan;
	}

	@ManyToOne
	@JoinColumn(name = "wirecenter_id", nullable = false)
	public ProcessArea getWireCenter() {
		return wireCenter;
	}

	public void setWireCenter(ProcessArea wireCenter) {
		this.wireCenter = wireCenter;
	}

}
