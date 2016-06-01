package com.altvil.aro.service.planning;

public interface Plan {
	long getPlanId();
	<T> T dependentPlan(long dependentId);
}
