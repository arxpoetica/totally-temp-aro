package com.altvil.aro.service.roic;

public interface CashFlows {

	int getPeriods();

	double[] getAsRawData();

	double getCashFlow(int period);

	CashFlows subtract(CashFlows c2);
}
