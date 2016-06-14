package com.altvil.aro.service.roic.analysis.calc;

import com.altvil.aro.service.roic.analysis.spi.ResolveContext;


public interface StreamFunction {

	void resolve(ResolveContext ctx) ;
	double calc(CalcContext ctx) ;

}
