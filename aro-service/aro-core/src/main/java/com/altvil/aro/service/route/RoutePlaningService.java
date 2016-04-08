package com.altvil.aro.service.route;

import com.altvil.aro.service.graph.builder.GraphNetworkModel;

public interface RoutePlaningService {

	public RouteModel createRouteModel(RouteNetworkData routeData, RoutingOptions options);

	/**
	 * Constructs a route model which contains a simple weighted graph by
	 * splitting GeoSegment edges in the network model into distinct edges such
	 * that each pinned location appears at a vertex.
	 * 
	 * @param networkModel
	 * @return
	 */
	public RouteModel planRoute(GraphNetworkModel networkModel);

}
