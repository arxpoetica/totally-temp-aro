package com.altvil.aro.service.grid;

public interface GridService {
	
	<T> T enhance(T bean, Class<T> api) ;

}
