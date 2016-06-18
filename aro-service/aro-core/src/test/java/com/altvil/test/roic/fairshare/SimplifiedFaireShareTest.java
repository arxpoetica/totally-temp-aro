package com.altvil.test.roic.fairshare;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;

import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.impl.SimpleFairShareModelFactory;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;

public class SimplifiedFaireShareTest extends AbstractFairShareTest {

	private FairShareModelFactory factory ;

	@Before
	public void init() {
		factory = new SimpleFairShareModelFactory() ;
	}
	
	@Test
	public void testAlgorithm() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,1}, {0,0}, {0,0}, {0,0}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(1.0, model.getTotalShare(), 0);
	}
	
	@Test
	public void testAlgorithm1() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,1}, {0,0}, {0,0}, {0,0}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(1.0, model.getTotalShare(), 0);
	}
	
	@Test
	public void testAlgorithm2() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,0}, {0,1}, {0,0}, {0,0}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(0.4, model.getTotalShare(), 0);
	}
	
	@Test
	public void testAlgorithm3() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,0}, {1,1}, {0,0}, {0,0}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(0.4, model.getTotalShare(), 0);
	}
	

	@Test
	public void testAlgorithm4() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,1}, {1,1}, {0,0}, {0,0}}, new double[]{1.3, 1.0, 1.0, 1.0}));
		assertEquals(0.5, model.getTotalShare(), 0.001);
	}
	
	@Test
	public void testAlgorithm5() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,1}, {1,1}, {0,1}, {0,1}}, new double[]{1.3, 1.0, 1.0, 1.0}));
		assertEquals(0.25, model.getTotalShare(), 0.001);
	}
	
	
	@Test
	public void testAlgorithm6() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{0,0}, {0,0}, {0,0}, {0,0}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(0, model.getTotalShare(), 0);
	}
	
	@Test
	public void testAlgorithm7() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,1}, {1,1}, {1,1}, {1,1}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(0.25, model.getTotalShare(), 0.00001);
	}
	
	
	
	@Test
	public void testAlgorithm9() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{0,0}, {1,1}, {1,1}, {1,1}}, new double[]{1.0, 1.0, 1.0, 1.0}));
		assertEquals(0, model.getTotalShare(), 0);
	}
	
	
	@Test
	public void testAlgorithm10() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,0}, {1,0}, {1,0}, {1,0}}, new double[]{1.0, 0.8, 1.0, 1.0}));
		assertEquals(0.25, model.getTotalShare(), 0.00000001);
	}
	
	
	
	@Test
	public void testAlgorithm12() {
		FairShareModel model = factory.createModel(createInputs(.1, .9, new int[][]{{1,0}, {1,1}, {1,0}, {1,0}}, new double[]{1.0, 0.8, 1.0, 1.0}));
		assertEquals(0.222222222, model.getTotalShare(), 0.00001);
	}
	
	
}
