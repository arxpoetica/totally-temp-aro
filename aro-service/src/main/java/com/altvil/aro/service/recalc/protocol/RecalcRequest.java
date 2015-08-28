package com.altvil.aro.service.recalc.protocol;

import java.util.ArrayList;
import java.util.Collection;

public class RecalcRequest {

	private int planId;
	private Collection<String> actions = new ArrayList<String>();

	public int getPlanId() {
		return planId;
	}

	public void setPlanId(int planId) {
		this.planId = planId;
	}

	public Collection<String> getActions() {
		return actions;
	}

	public void setActions(Collection<String> actions) {
		this.actions = actions;
	}

}
