package com.altvil.test.roic;

import org.junit.Test;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.impl.StreamAssemblerImpl;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.spi.ResolveContext;
import com.vividsolutions.jts.util.Assert;

import static org.junit.Assert.*;

public class EngineTest {
	
	
	@Test
	public void testEngine() {
	
		CurveIdentifier id = new CurveIdentifier() {
		};
		
		StreamAssemblerImpl a = new StreamAssemblerImpl() ;
		a.setAnalysisPeriod(new AnalysisPeriod(2015,10)).add(id, new StreamFunction() {
			
			@Override
			public void resolve(ResolveContext ctx) {
			}
			
			@Override
			public double calc(CalcContext ctx) {
				return ctx.getPeriod();
			}
		})
		.addOutput(id);
		
		StreamModel m = a.resolveAndBuild() ;
		AnalysisRow row = m.getAnalysisRow(id) ;
		
		for(int i=0 ; i<10 ; i++) {
			Assert.equals((double) i, row.getValue(i));
		}
		
	}

}
