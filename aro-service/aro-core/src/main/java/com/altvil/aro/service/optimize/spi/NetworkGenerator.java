package com.altvil.aro.service.optimize.spi;

import java.util.Optional;
import java.util.function.Supplier;

import com.altvil.aro.service.plan.CompositeNetworkModel;


public interface NetworkGenerator extends Supplier<Optional<CompositeNetworkModel>> {

	boolean matches(NetworkGenerator other) ;
	
}
