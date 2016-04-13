package com.altvil.netop.jobs;

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
}
