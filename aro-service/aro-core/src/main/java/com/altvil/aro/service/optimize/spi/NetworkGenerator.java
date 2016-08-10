package com.altvil.aro.service.optimize.spi;

import java.util.Optional;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.plan.CompositeNetworkModel;


public interface NetworkGenerator  {

	Optional<CompositeNetworkModel> get(ApplicationContext appCtx) ;
	boolean matches(NetworkGenerator other) ;
	
}
