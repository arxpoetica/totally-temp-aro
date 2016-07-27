package com.altvil.aro.service.optimization.strategy.spi;

import com.altvil.aro.service.roic.CashFlows;

public interface FinancialAnalysis {

	boolean isValid();

	CashFlows getCashFlows();

	double getIrr();

	double getNpv();

	CashFlows getRoicCashFlows();

	double getRoicIrr();

	double getRoicNpv();

	double getBudget();

	double getCoverage();

}
