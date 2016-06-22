package com.altvil.aro.service.plan;

public interface GlobalConstraint {
	double nextParametric();
	boolean isConverging(Object plan);
}
