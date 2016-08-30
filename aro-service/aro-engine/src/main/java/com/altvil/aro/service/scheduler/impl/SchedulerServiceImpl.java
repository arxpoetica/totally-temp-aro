package com.altvil.aro.service.scheduler.impl;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.scheduler.SchedulerService;

@Service
public class SchedulerServiceImpl implements SchedulerService {

	private ExecutorService executorService ;
	
	@PostConstruct
	void postConstruct() {
		//TODO Make Config + Add Job Tracking
		executorService = Executors.newFixedThreadPool(40) ;
	}
	
	@Override
	public <T> Future<T> submit(Callable<T> callable) {
		return executorService.submit(callable) ;
	}

}
