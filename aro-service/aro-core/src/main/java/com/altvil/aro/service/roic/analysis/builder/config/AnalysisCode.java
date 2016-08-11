package com.altvil.aro.service.roic.analysis.builder.config;

import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;


public enum AnalysisCode implements CurveIdentifier {
	
	cashflow,
	penetration,
	arpu,
	houseHolds,
	houseHolds_global_count,
	revenue,
	cost,
	total_households,
	
	new_connections_percent,

	premises_passed,
	premises_passed_delta,
	
	subscribers_count,
	subscribers_penetration,
	network_deployment,
	new_connections,
	new_connections_count,
	new_connections_period,
	new_connections_cost,
	opex_expenses,
	maintenance_expenses,

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%
}
