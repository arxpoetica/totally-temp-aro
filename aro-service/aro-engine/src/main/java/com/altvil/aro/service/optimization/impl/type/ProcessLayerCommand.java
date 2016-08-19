package com.altvil.aro.service.optimization.impl.type;

import java.util.Collection;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;

public interface ProcessLayerCommand {

	ServiceLayer getServiceLayer();

	Collection<WirecenterOptimizationRequest> getServiceAreaCommands();

}
