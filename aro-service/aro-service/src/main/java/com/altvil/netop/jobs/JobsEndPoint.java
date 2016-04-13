package com.altvil.netop.jobs;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;

@RestController
public class JobsEndPoint {
	
	@Autowired
	private JobService jobService;
	
	private ExecutorService executorService = Executors.newFixedThreadPool(2);

	@RequestMapping(value = "/jobs/status", method = RequestMethod.GET)
	public @ResponseBody Object list() {
		return jobService.getRemainingJobs();
	}

	@RequestMapping(value = "/jobs/status", method = RequestMethod.POST)
	public @ResponseBody Object status(
			@RequestBody JobsRequest request) {
			final Job<?> job = jobService.get(request.getId());
			System.out.println("Found " + job);
			return job;
	}

	@RequestMapping(value = "/jobs/test", method = RequestMethod.GET)
	public @ResponseBody Object test() {
		return jobService.submit(() -> {
			System.out.println("Callable started");
			Thread.sleep(30000L);
			System.out.println("Callable finished");
			
			return null;
		}, executorService);
	}
}
