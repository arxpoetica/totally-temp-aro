package com.altvil.netop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.plan.impl.PlanServiceImpl;

public class BaseEndPointHandler {
	
	private static final Logger log = LoggerFactory
			.getLogger(BaseEndPointHandler.class.getName());

	protected interface RestAction<T> {
		T execute() throws Exception ;
	}
	
	protected interface RestUpdate {
		void execute() throws Exception ;
	}
	
	protected <T> T execute(RestAction<T> a) {
		try {
			return a.execute() ;
		} catch( Throwable err ) {
			log.error(err.getMessage(), err);
			throw new RuntimeException("Check Logs for this message " + err.getMessage()) ;
		}
	}
	
	protected void update(RestUpdate update) {
		try {
			 update.execute() ;
		} catch( Throwable err ) {
			log.error(err.getMessage(), err);
			throw new RuntimeException("Check Logs for this message " + err.getMessage()) ;
		}
	}
	
	
}
