package com.altvil.aro.service.cu;

import java.io.Serializable;

public interface ComuteUnitService {


	ComputeUnit<?> getBsaExecutor(String name);

	<T extends Serializable> ComputeUnitBuilder<T> build(Class<T> clz, Class<? extends ComputeServiceApi> serviceApi);
	
}
