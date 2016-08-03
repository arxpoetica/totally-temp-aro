package com.altvil.aro.service.entity;

import static org.mockito.Mockito.*;
import static org.junit.Assert.*;

import org.junit.Before;
import org.junit.Test;

public class SimpleNetworkFinancialsTest {

	SimpleNetworkFinancials f;
	LocationDemand ld;

	@Before
	public void setup() {
		DemandStatistic ds = mock(DemandStatistic.class);
		when(ds.getFairShareDemand()).thenReturn(4.5);

		ld = mock(LocationDemand.class);
		when(ld.getLocationDemand(any())).thenReturn(ds);
		when(ld.getMonthlyRevenueImpact()).thenReturn(125D);

		f = new SimpleNetworkFinancials(ld, 1500, 0.02, 10);
	}

	@Test
	public void testGetCoCost() {
		assertEquals(1205, f.getCoCost(), 1);
	}

	@Test
	public void testGetDiscountRate() {
		assertEquals(0.02, f.getDiscountRate(), 0.0001);
	}

	@Test
	public void testGetEquipmentCost() {
		assertEquals(4480, f.getEquipmentCost(), 1);
	}

	@Test
	public void testGetFdhCost() {
		assertEquals(0, f.getFdhCost(), 0.0001);
	}

	@Test
	public void testGetFdtCost() {
		assertEquals(1559, f.getFdtCost(), 1);
	}

	@Test
	public void testGetFiberCost() {
		assertEquals(25980, f.getFiberCost(), 0.0001);
	}

	@Test
	public void testGetFiberLength() {
		assertEquals(1500, f.getFiberLength(), 0.0001);
	}

	@Test
	public void testGetLocationDemand() {
		assertEquals(ld, f.getLocationDemand());
	}

	@Test
	public void testGetNpv() {
		assertEquals(-16986D, f.getNpv(), 1);
	}

	@Test
	public void testGetRevenue() {
		assertEquals(1500, f.getRevenue(), 0.0001);
	}

	@Test
	public void testGetTotalCost() {
		assertEquals(30460, f.getTotalCost(), 1);
	}

	@Test
	public void testGetYears() {
		assertEquals(10, f.getYears());
	}

	@Test
	public void testSetLocationDemand() {
		DemandStatistic ds = mock(DemandStatistic.class);
		when(ds.getFairShareDemand()).thenReturn(7D);

		ld = mock(LocationDemand.class);
		when(ld.getLocationDemand(any())).thenReturn(ds);
		when(ld.getMonthlyRevenueImpact()).thenReturn(78D);
		f.setLocationDemand(ld);

		assertEquals(ld, f.getLocationDemand());
		assertEquals(6969D, f.getEquipmentCost(), 1);
	}

	@Test
	public void testSetDiscountRate() {
		f.setDiscountRate(0.04);
		assertEquals(0.04, f.getDiscountRate(), 0.0001);
		assertEquals(-18294, f.getNpv(), 1);
	}

	@Test
	public void testSetFiberLength() {
		assertEquals(1500, f.getFiberLength(), 0.0001);
		assertEquals(25980, f.getFiberCost(), 0.0001);
		
		f.setFiberLength(3500);
		
		assertEquals(3500, f.getFiberLength(), 0.0001);
		assertEquals(60620, f.getFiberCost(), 0.0001);
	}

	@Test
	public void testSetYears() {
		assertEquals(10, f.getYears());
		assertEquals(-16986D, f.getNpv(), 1);
		
		f.setYears(5);
		
		assertEquals(5, f.getYears());
		assertEquals(-23390D, f.getNpv(), 1);
	}

}
