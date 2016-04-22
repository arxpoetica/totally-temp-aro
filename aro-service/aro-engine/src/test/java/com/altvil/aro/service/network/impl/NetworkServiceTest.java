/**
 * 
 */
package com.altvil.aro.service.network.impl;

import static org.junit.Assert.*;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

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
		nsi.getNetworkData(nr);
		nsi.getNetworkData(nr);
		nsi.getNetworkData(nr);		
		assert(true);
		//fail("Not yet implemented");
	}

}
