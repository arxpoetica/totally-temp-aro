/**
 * 
 */
package com.altvil.test.aro.service.network.impl;

import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;

import java.util.function.Predicate;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.enumerations.FiberPlanAlgorithm;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value="/aroServlet-servletTest.xml")
public class NetworkServiceTest {

	@Autowired
	NetworkService nsi;
	
	@BeforeClass
	public static void setUp() throws Exception {
	}

	@AfterClass
	public static void tearDown() throws Exception {
	}

	@Test
	public void testGetNetworkData() {
		FiberPlanConfiguration fps = mockFiberPlanStrategy(3, FiberPlanAlgorithm.CAPEX, 2016, true);
		NetworkData nd = nsi.getNetworkData(fps);
		assertNotNull(nd);
		NetworkData nd2 = nsi.getNetworkData(fps);
		assertNotNull(nd2);
		nd = nsi.getNetworkData(fps);
		assertNotNull(nd);

		//fail("Not yet implemented");
	}
	
	private class MockFiberPlan extends AbstractFiberPlan {
		protected MockFiberPlan(FiberPlanAlgorithm algorithm) {
			super(algorithm);
		}
	}
	
	private FiberPlanConfiguration mockFiberPlanStrategy(final long planId, final FiberPlanAlgorithm algorithm, final int year, final boolean filteringRoadLocationsBySelection) {
		return new FiberPlanConfiguration() {
			@Override
			public AbstractFiberPlan getFiberPlan() {
				final MockFiberPlan mockFiberPlan = new MockFiberPlan(algorithm);
				mockFiberPlan.setPlanId(3);
				mockFiberPlan.setYear(year);
				return mockFiberPlan;
			}

//			@Override
//			public List<Long> getSelectedRoadLocationIds$() {
//				// TODO Auto-generated method stub
//				return null;
//			}

			@Override
			public boolean isFilteringRoadLocationDemandsBySelection() {
				return false;
			}

			@Override
			public boolean isFilteringRoadLocationsBySelection() {
				return filteringRoadLocationsBySelection;
			}

			@Override
			public FiberPlanConfiguration dependentPlan(long dependentId) {
				// TODO Auto-generated method stub
				return null;
			}

			@Override
			public Predicate<AroEdge<GeoSegment>> getSelectedEdges(NetworkData networkData) {
				// TODO Auto-generated method stub
				return null;
			}

			@Override
			public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
				// TODO Auto-generated method stub
				return null;
			}};
	}

	@Test
	public void testSelectedVersusAllAssignments() {
		FiberPlanConfiguration fpsSelected = mockFiberPlanStrategy(3, FiberPlanAlgorithm.CAPEX, 2016, true);
		FiberPlanConfiguration fpsAll = mockFiberPlanStrategy(3, FiberPlanAlgorithm.CAPEX, 2016, false);
		
		NetworkData ndSelected = nsi.getNetworkData(fpsSelected);
		NetworkData ndAll = nsi.getNetworkData(fpsAll);
		int selectedCount = ndSelected.getRoadLocations().size();
		int allCount = ndAll.getRoadLocations().size();
		System.out.println("testSelectedVersusAllAssignments()  selected:" + selectedCount + " all:" + allCount);
		assertNotEquals(selectedCount, allCount);
	}

}
