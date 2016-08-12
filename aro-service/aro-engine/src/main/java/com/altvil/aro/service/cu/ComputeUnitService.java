package com.altvil.aro.service.cu;

import java.io.Serializable;

public interface ComputeUnitService {


	ComputeUnit<?> getBsaExecutor(String name);

	<T extends Serializable> ComputeUnitBuilder<T> build(Class<T> clz, Class<? extends ComputeServiceApi> serviceApi);
	
}
