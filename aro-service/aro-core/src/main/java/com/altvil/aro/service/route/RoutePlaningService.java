package com.altvil.aro.service.route;

import com.altvil.aro.service.graph.builder.GraphNetworkModel;


public interface RoutePlaningService {

	public RouteModel createRouteModel(RouteNetworkData routeData,
			RoutingOptions options);
	
	public RouteModel planRoute(GraphNetworkModel networkModel) ;
	

}
