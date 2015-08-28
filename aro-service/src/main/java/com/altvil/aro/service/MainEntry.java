package com.altvil.aro.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Guice;
import com.google.inject.Injector;


public class MainEntry {

	private static final Logger log = LoggerFactory.getLogger(MainEntry.class.getName());
	
	private static Injector injector ;
	
	static {
		injector = createInjector() ;
	}
	
	private static Injector createInjector() {
		try {
			return Guice.createInjector(new AppInjector()) ;
		} catch( Throwable err ) {
			log.error(err.getMessage(), err);
			return null  ;
		}
	}
	
	
	public static Injector getAppInjector() {
		return injector ;
	}
	
	public static <T> T service(Class<T> api) {
		return injector.getInstance(api) ;
	}
	
}
