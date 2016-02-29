package com.altvil.netop.plan;

import java.util.List;

import com.altvil.aro.service.recalc.protocol.RecalcJob;

public class MasterPlanResponse {

	private RecalcJob recalcJob;
	private List<Long> wireCenterids;

	public RecalcJob getRecalcJob() {
		return recalcJob;
	}

	public void setRecalcJob(RecalcJob recalcJob) {
		this.recalcJob = recalcJob;
	}

	public List<Long> getWireCenterids() {
		return wireCenterids;
	}

	public void setWireCenterids(List<Long> wireCenterids) {
		this.wireCenterids = wireCenterids;
	}

}
