/**
 * 
 */
package com.altvil.test.aro.service.network.impl;

import static org.junit.Assert.*;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkRequest.LocationLoadingRequest;
import com.altvil.aro.service.network.NetworkService;


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
		NetworkRequest nr = new NetworkRequest();
		nr.setPlanId(3);
		nr.setYear(2016);
		nr.setLocationLoadingRequest(LocationLoadingRequest.SELECTED);
		NetworkData nd = nsi.getNetworkData(nr);
		assertNotNull(nd);
		NetworkData nd2 = nsi.getNetworkData(nr);
		assertNotNull(nd2);
		nd = nsi.getNetworkData(nr);
		assertNotNull(nd);

		//fail("Not yet implemented");
	}

}
