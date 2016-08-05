package com.altvil.aro.service.optimize.spi;

import java.io.Serializable;
import java.util.Collection;
import java.util.Optional;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.plan.CompositeNetworkModel;

public interface NetworkModelBuilder extends Serializable {

	Optional<CompositeNetworkModel> createModel(ApplicationContext ctx, Collection<Long> rejectedLocations);

}