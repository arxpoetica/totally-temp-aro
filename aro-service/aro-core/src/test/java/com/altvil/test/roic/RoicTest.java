package com.altvil.test.roic;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.RoicConstants;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.RoicInputs;
import com.altvil.aro.service.roic.analysis.impl.AnalysisServiceImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class RoicTest {

	private AnalysisService analysisService;

	@Before
	public void init() {
		analysisService = new AnalysisServiceImpl();
	}

	@Test
	public void testRoic() {

		AnalysisPeriod ap = new AnalysisPeriod(2016, 15);

		RoicInputs copperInputs = RoicInputs.updateInputs(RoicConstants.CopperInputs, 200, 0);
		RoicInputs fiberInputs = RoicInputs.updateInputs(RoicConstants.FiberConstants, 120, 0);

		RoicModel model = analysisService.createRoicModelBuilder()
				.setAnalysisPeriod(ap).addRoicInputs(copperInputs)
				.addRoicInputs(copperInputs)
				.addRoicInputs(fiberInputs).build();

		
		Writer w = new StringWriter() ;
		PrintWriter pw = new PrintWriter(w, true) ;
		pw.flush(); 
		write(model, pw) ;
		System.out.println(w.toString()) ;
		
	}

	public void write(RoicModel model, PrintWriter ps) {
		List<String> curves = new ArrayList<>(model.getCurvePaths());
		Collections.sort(curves);
		
		for(String c : curves) {
			write(ps, c, model.getAnalysisRow(c)) ;
		}

	}
	
	private void write(PrintWriter ps, String c, AnalysisRow r) {
		ps.print(c);
		
		for(int i = 0 ; i<r.getSize() ; i++) {
			ps.print(",");
			ps.print(r.getValue(i));
		}
		
		ps.println();
	}

	


//	private RoicInputs createRoicInputs() {
//		RoicInputs ri = new RoicInputs();
//		ri.setComponentInputs(Collections.singleton(createComponentInput()));
//		ri.setFixedCost(10000);
//		ri.setType(NetworkAnalysisType.fiber);
//		return ri;
//	}
//
//	private RoicInputs createCopperRoicInputs() {
//		RoicInputs ri = new RoicInputs();
//		ri.setComponentInputs(Collections
//				.singleton(createCopperComponentInput()));
//		ri.setFixedCost(10000);
//		ri.setType(NetworkAnalysisType.copper);
//		return ri;
//	}

//	private ComponentInput createCopperComponentInput() {
//
//		return ComponentInput
//				.build()
//				.setComponentType(ComponentType.household)
//				.setArpu(20)
//				.setChurnRate(0.01)
//				.setChurnRateDecrease(0.00006)
//				.setEntityCount(500)
//				.setEntityGrowth(0.0000)
//				.setNetworkPenetration(
//						new DefaultNetworkPenetration(0.8, 0.4, -.03))
//				.setOpexPercent(0.043).assemble();
//	}
//
//	private ComponentInput createComponentInput() {
//
//		return ComponentInput.build().setComponentType(ComponentType.household)
//				.setArpu(100).setChurnRate(0.01).setChurnRateDecrease(0.00006)
//				.setEntityCount(150).setEntityGrowth(0.0005)
//				.setNetworkPenetration(createPenetration())
//				.setOpexPercent(0.043).assemble();
//	}
//
//	private NetworkPenetration createPenetration() {
//		return new DefaultNetworkPenetration(0.2, 0.6, -.03);
//	}

}
