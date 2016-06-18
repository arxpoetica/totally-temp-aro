package com.altvil.test.roic.fairshare;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;

import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.impl.StrangeFairShareModelFactory;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;
import com.altvil.aro.service.roic.model.NetworkType;

public class AltvilFairShareTest extends AbstractFairShareTest {

	private FairShareModelFactory factory;

	@Before
	public void init() {
		factory = new StrangeFairShareModelFactory();
	}

	@Test
	public void testAlgorithm() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 0, 0 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(1.0, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm1() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 0, 0 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(1.0, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm2() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 0 }, { 0, 1 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(0.1, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm3() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 0 }, { 1, 1 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(0.05, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm4() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 1, 1 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.3, 1.0, 1.0, 1.0 }));
		System.out.println(model.getTotalShare() + " "
				+ model.getShare(NetworkType.Copper) + " "
				+ model.getShare(NetworkType.Fiber));
		assertEquals(0.56552, model.getTotalShare(), 0.001);
	}

	@Test
	public void testAlgorithm5() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 1, 1 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.3, 1.0, 1.0, 1.0 }));
		System.out.println(model.getTotalShare()) ;
		assertEquals(0.5652, model.getTotalShare(), 0.001);
	}

	@Test
	public void testAlgorithm6() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 0, 0 }, { 0, 0 }, { 0, 0 }, { 0, 0 } },
				new double[] { 1.3, 1.0, 1.0, 1.0 }));
		assertEquals(0, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm7() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 1, 1 }, { 1, 1 }, { 1, 1 } },
				new double[] { 1.3, 1.0, 1.0, 1.0 }));
		assertEquals(0.302325581, model.getTotalShare(), 0.00001);
	}

	@Test
	public void testAlgorithm8() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 1, 1 }, { 1, 1 }, { 1, 1 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(.25, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm9() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 0, 0 }, { 1, 1 }, { 1, 1 }, { 1, 1 } },
				new double[] { 1.0, 1.0, 1.0, 1.0 }));
		assertEquals(0, model.getTotalShare(), 0);
	}

	@Test
	public void testAlgorithm10() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 0 }, { 1, 0 }, { 1, 0 }, { 1, 0 } },
				new double[] { 1.0, 0.8, 1.0, 1.0 }));
		assertEquals(0.263157895, model.getTotalShare(), 0.00000001);
	}

	@Test
	public void testAlgorithm11() {
		FairShareModel model = factory.createModel(createInputs(.45, .55,
				new int[][] { { 1, 0 }, { 1, 0 }, { 1, 0 }, { 1, 0 } },
				new double[] { 1.0, 0.8, 1.0, 1.0 }));
		assertEquals(0.263157895, model.getTotalShare(), 0.00000001);
	}

	@Test
	public void testAlgorithm12() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 0 }, { 1, 1 }, { 1, 0 }, { 1, 0 } },
				new double[] { 1.0, 0.8, 1.0, 1.0 }));
		assertEquals(0.026315789, model.getTotalShare(), 0.00000001);
	}

	@Test
	public void testAlgorithm14() {
		FairShareModel model = factory.createModel(createInputs(.1, .9,
				new int[][] { { 1, 1 }, { 1, 1 }, { 1, 1 }, { 1, 1 } },
				new double[] { 1.4, 1.0, 0.8, 0.4}));
		assertEquals(0.388888888888, model.getTotalShare(), 0.00000001);
	}

}
