package com.altvil.aro.service.scheduler;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;

public interface SchedulerService {
	
	<T> Future<T> submit(Callable<T> callable) ;

}
