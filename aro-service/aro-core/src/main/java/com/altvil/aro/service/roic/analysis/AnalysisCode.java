package com.altvil.aro.service.roic.analysis;

public enum AnalysisCode {
	
	revenue,
	premises_passed,
	subscribers_count,
	subscribers_penetration,
	network_deployment,
	new_connections,
	opex_expenses,

	// Revenue By Network By LocationType
	// Premises Passed Locations connected By LocationType
	// Subscribers By EntityType ( Penetration * Location )
	// Subscribers By EntityType ( Penetration )

	// CAPEX (2016)
	// Network Deployment
	// Connect Crazy Formula By Year
	// Revenue * 4.23%
}
