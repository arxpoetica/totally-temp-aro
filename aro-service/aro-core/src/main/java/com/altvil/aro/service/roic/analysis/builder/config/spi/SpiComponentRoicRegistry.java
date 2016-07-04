package com.altvil.aro.service.roic.analysis.builder.config.spi;

import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;

public interface SpiComponentRoicRegistry<T> {
	void register(SpiComponentConfig<T> config);
	SpiComponentConfig<T> getConfig(ComponentType type);
}