package com.altvil.netop.jobs;

import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
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
	public @ResponseBody Object list(Principal requestor) {
		return jobService.getRemainingJobs().stream().filter((j) -> j.getCreator().equals(requestor)).collect(Collectors.toList());
	}
	
	@RequestMapping(value = "/jobs/test", method = RequestMethod.GET)
	public @ResponseBody Object test(Principal requestor) {
		return jobService.submit(new JobService.Builder<Void>(requestor).setCallable(() -> {Thread.sleep(10000); return null;}));
	}

	@RequestMapping(value = "/jobs/status", method = RequestMethod.POST)
	public @ResponseBody Job<?> status(Principal requestor,
			@RequestBody JobsRequest request) {
			final Job<Object> job = jobService.get(request.getId());
			
			if (job.getCreator().equals(requestor)) {			
				return job;
			}
			
			return null;
	}
	
	@SubscribeMapping("/jobs")
	public Collection<Job<?>> subscribe(Principal requestor) {
		return jobService.getRemainingJobs().stream().filter((j) -> j.getCreator().equals(requestor)).collect(Collectors.toList());
	}
	
	@MessageMapping("/jobs/queue")
	@SendToUser("/topic/jobs")
	public Collection<Job<?>> contentsOfQueue(Principal requestor) {
		return jobService.getRemainingJobs().stream().filter((j) -> j.getCreator().equals(requestor)).collect(Collectors.toList());
	}
}
