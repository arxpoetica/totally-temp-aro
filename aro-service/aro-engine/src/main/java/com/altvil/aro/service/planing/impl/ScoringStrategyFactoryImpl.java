package com.altvil.aro.service.planing.impl;

import java.util.EnumMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.planing.ScoringStrategyFactory;
import com.altvil.enumerations.OptimizationType;

@Service("scoringStrategyFactory")
@Deprecated
public class ScoringStrategyFactoryImpl implements ScoringStrategyFactory {

	private Map<OptimizationType, ScoringStrategy> map = new EnumMap<>(OptimizationType.class) ;
	
	@PostConstruct
	public void init() {
		//map.put(OptimizationType.PENETRATION, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getDemand()))) ;
		map.put(OptimizationType.IRR, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		map.put(OptimizationType.BUDGET_IRR, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		map.put(OptimizationType.BUDGET_THRESHHOLD_IRR, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		map.put(OptimizationType.TARGET_IRR, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		
		map.put(OptimizationType.CAPEX, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getDemand()))) ;
		map.put(OptimizationType.COVERAGE, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getDemand()))) ;
		map.put(OptimizationType.COVERAGE, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
		map.put(OptimizationType.NPV, (node) -> -(divide(node.getCapex(), node.getFiberCoverage().getMonthlyRevenueImpact()))) ;
	}
	
	private static final double divide(double a, double b) {
		if( b == 0 ) {
			return 0 ;
		}
		return a / b ;
	}
	
	@Override
	public ScoringStrategy getScoringStrategy(OptimizationType optimizationType) {
		return map.get(optimizationType) ;
	}

	
	
	

}
