package com.altvil.aro.service.roic.analysis.calc;



public interface StreamFunction {

	void resolve(ResolveContext ctx) ;
	double calc(CalcContext ctx) ;

}
