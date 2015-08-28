package com.altvil.test.graph;


import org.junit.Test;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.MainEntry;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.util.geometry.GeometryUtil;

public class TestFDT {

	@Test
	public void testFdt() {
		try {
			MainEntry.service(PlanService.class).computeNetworkNodes(4, NetworkNodeType.fiber_distribution_terminal).forEach(n -> System.out.println(GeometryUtil.toWKT(n.getPoint())));
		} catch( Throwable err) {
			err.printStackTrace(); 
		}
	}
	
	
	
	
}
