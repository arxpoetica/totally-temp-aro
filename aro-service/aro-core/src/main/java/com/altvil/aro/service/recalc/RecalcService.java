package com.altvil.aro.service.recalc;

import java.util.Collection;
import java.util.concurrent.Callable;

public interface RecalcService {

	public <T> Job<T> submit(Callable<T> task) throws RecalcException;
	public Collection<Job<?>> getRemainingJobs() ;

}
