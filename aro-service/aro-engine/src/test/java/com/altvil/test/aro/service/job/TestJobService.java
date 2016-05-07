package com.altvil.test.aro.service.job;

import static org.junit.Assert.*;

import java.io.Serializable;
import java.security.Principal;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.cluster.ClusterGroup;
import org.apache.ignite.lang.IgniteCallable;
import org.junit.AfterClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "/aroServlet-servletTest.xml"})
public class TestJobService {
	static Ignite igniteGrid;
	static ExecutorService executorService;
	static Principal user1 = new TestPrincipal("Kevin");
	static Principal user2 = new TestPrincipal("Greiner");
	
	@PostConstruct
	public static void postConstruct() throws Exception {
		ClusterGroup executorGroup = igniteGrid.cluster().withAsync().forServers();
		executorService = igniteGrid.executorService(executorGroup);
	}
	
	@Autowired  //NOTE the method name determines the name/alias of Ignite grid which gets bound!
	private void setJobServiceIgniteGrid(Ignite igniteBean)
	{
		TestJobService.igniteGrid = igniteBean;
	}	

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
		executorService.shutdownNow();
	}

	@Autowired
	JobService js;

	private void successfulJobChecks(final int duration, Map<String, Object> meta, Job<?> job) {
		final Date scheduledTime = job.getScheduledTime();
		final Date startedTime = job.getStartedTime();
		assertNotNull(scheduledTime);
		assertNotNull(startedTime);
		assertNotNull(job.getCompletedTime());
		assertTrue(scheduledTime.compareTo(startedTime) <= 0);
		long executionTime = job.getCompletedTime().getTime() - job.getStartedTime().getTime();
		assertTrue(duration - 20 < executionTime && executionTime < duration + 20);

		if (meta != null) {
			Job.Id id = job.getId();

			meta.entrySet().stream().forEach((e) -> {
				assertEquals(e.getValue(), id.get(e.getKey()));
			});
		}
		
		wait(js);
	}

	@Test
	public void testGetRemainingJobs() {
		assertTrue(js.getRemainingJobs().isEmpty());

		js.submit(new JobService.Builder<Void>(user1).setCallable(new TestCallable<>(1000)));

		assertEquals(1, js.getRemainingJobs().size());

		js.submit(new JobService.Builder<Void>(user1).setCallable(new TestCallable<>(2000)));

		assertEquals(2, js.getRemainingJobs().size());

		wait(js);
	}

	@Test
	public void testSubmitCallableOfT() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new JobService.Builder<Integer>(user1).setCallable(new TestCallable<>(duration, result)).setComputeGrid(igniteGrid.compute()));

		assertEquals(result, job.get().intValue());

		wait(js);

		successfulJobChecks(duration, null, job);
	}

	@Test
	public void testSubmitCallableOfTExecutorService() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new JobService.Builder<Integer>(user2).setCallable(new TestCallable<>(duration, result)).setComputeGrid(TestJobService.igniteGrid.compute()));
		
		assertEquals(result, job.get().intValue());
		wait(js);
		successfulJobChecks(duration, null, job);
	}

	@Test
	public void testSubmitMapOfStringObjectCallableOfTExecutorService() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		final Map<String, Object> meta = new HashMap<>();
		meta.put("key1", 15);

		Job<Integer> job = js.submit(new JobService.Builder<Integer>(user2).setCallable(new TestCallable<>(duration, result)).setMetaIdentifiers(meta).setComputeGrid(TestJobService.igniteGrid.compute()));
		
		assertEquals(result, job.get().intValue());

		wait(js);

		successfulJobChecks(duration, meta, job);
	}

	private void wait(JobService js) {
		js.getRemainingJobs().stream().forEach((j) -> {
			try {
				j.get();
			} catch (Exception e) {
				e.printStackTrace();
			}
		});
	}
}

class TestCallable<T> implements IgniteCallable<T> {
	private static final long serialVersionUID = 1L;
	
	long	delay;
	boolean	fail;
	T		result;

	public TestCallable(long delay) {
		this.delay = delay;
		this.fail = true;
	}

	public TestCallable(long delay, T result) {
		this.delay = delay;
		this.fail = false;
		this.result = result;
	}

	@Override
	public T call() throws Exception {
		Thread.sleep(delay);
		return result;
	}
}

class TestPrincipal implements Serializable, Principal {
	private static final long serialVersionUID = 1L;

	private final String name;
	
	public TestPrincipal(String name) {
		this.name = name;
	}

	@Override
	public String getName() {
		return name;
	}
}

