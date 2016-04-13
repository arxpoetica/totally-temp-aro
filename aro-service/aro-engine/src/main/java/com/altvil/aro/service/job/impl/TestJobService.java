package com.altvil.aro.service.job.impl;

import static org.junit.Assert.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "/EngineTest-context.xml"})
public class TestJobService {
	static ExecutorService executorService;
	
	@Autowired
	JobService js;

	@BeforeClass
	public static void setUpBeforeClass() throws Exception {
		executorService = Executors.newFixedThreadPool(2);
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
		executorService.shutdownNow();
	}

	@Test
	public void testGetRemainingJobs() {
		assertTrue(js.getRemainingJobs().isEmpty());

		js.submit(new TestRunnable(1000));

		assertEquals(1, js.getRemainingJobs().size());

		js.submit(new TestRunnable(2000));

		assertEquals(2, js.getRemainingJobs().size());

		wait(js);
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

	@Test
	public void testSubmitCallableOfTExecutorService() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new TestCallable<Integer>(duration, result), executorService);

		assertEquals(result, job.get().intValue());

		successfulJobChecks(duration, null, job);
		
		wait(js);
	}

	private void successfulJobChecks(final int duration, Map<String, Object> meta, Job<?> job) {
		assertNotNull(job.getScheduledTime());
		assertNotNull(job.getStartedTime());
		assertNotNull(job.getCompletedTime());
		assertTrue(job.getScheduledTime().before(job.getStartedTime()));
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
	public void testSubmitMapOfStringObjectRunnableTExecutorService() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		final Map<String, Object> meta = new HashMap<>();
		meta.put("key1", 15);

		Job<Integer> job = js.submit(meta, new TestCallable<Integer>(duration, result), executorService);

		assertEquals(result, job.get().intValue());

		successfulJobChecks(duration, meta, job);
		
		wait(js);
	}

	@Test
	public void testSubmitCallableOfT() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new TestCallable<Integer>(duration, result));

		assertEquals(result, job.get().intValue());

		successfulJobChecks(duration, null, job);
		
		wait(js);
	}

	@Test
	public void testSubmitMapOfStringObjectRunnable() throws InterruptedException, ExecutionException {
		final int duration = 1000;
		final Map<String, Object> meta = new HashMap<>();
		meta.put("key2", 30);

		Job<?> job = js.submit(meta, new TestRunnable(duration), executorService);

		assertNull(job.get());

		successfulJobChecks(duration, meta, job);
		
		wait(js);
	}

}

class TestTask<T> {
	long	delay;
	boolean	fail;
	T		result;

	public TestTask(long delay, T result) {
		this.delay = delay;
		this.fail = false;
		this.result = result;
	}

	public TestTask(long delay) {
		this.delay = delay;
		this.fail = true;
	}

	T doit() throws InterruptedException {
		Thread.sleep(delay);
		return null;
	}
}

class TestCallable<T> extends TestTask<T> implements Callable<T> {
	public TestCallable(long delay) {
		super(delay);
	}

	public TestCallable(long delay, T result) {
		super(delay, result);
	}

	@Override
	public T call() throws Exception {
		return doit();
	}
}

class TestRunnable extends TestTask<Void> implements Runnable {
	public TestRunnable(long delay) {
		super(delay);
	}

	@Override
	public void run() {
		try {
			doit();
		} catch (InterruptedException e) {
		}

		return;
	}
}
