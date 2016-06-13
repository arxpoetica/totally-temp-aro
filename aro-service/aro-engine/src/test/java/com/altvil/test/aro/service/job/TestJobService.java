package com.altvil.test.aro.service.job;

import static org.junit.Assert.*;

import java.io.Serializable;
import java.security.Principal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteException;
import org.apache.ignite.cluster.ClusterGroup;
import org.apache.ignite.compute.ComputeJobAdapter;
import org.apache.ignite.compute.ComputeJobResult;
import org.apache.ignite.compute.ComputeTaskSplitAdapter;
import org.apache.ignite.lang.IgniteCallable;
import org.junit.AfterClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;
import com.altvil.aro.service.job.impl.JobRequestIgniteComputeTask;


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

		js.submit(new JobRequestIgniteCallable<Void>(user1, igniteGrid.compute(), new TestCallable<>(2000)));

		assertEquals(1, js.getRemainingJobs().size());

		js.submit(new JobRequestIgniteCallable<Void>(user1, igniteGrid.compute(), new TestCallable<>(2000)));

		assertEquals(2, js.getRemainingJobs().size());

		wait(js);
	}

//TODO demonstrate MDC for logging parameters such as host, client IP, etc. http://logback.qos.ch/manual/mdc.html
//TODO enable XLogger extended SLF4J logger for entry() exit() throwing() within remote jobs. consider Java Agent for bytecode injection
//TODO demonstrate use of SLF4J Profiler class for logging performance statistics
//TODO implement SLF4J servlet filter to populate web client info into MDC.  Propagate through to Ignite
//TODO HIGH demonstrate near-cache for a compute group.  Maybe also demonstrate this on top of OFFHEAP_TIERED or OFFHEAP_VALUES memory modes.
//TODO HIGH demonstrate using shared ComputeTaskSession to bound an optimization (e.g., to cancel options which grow beyond known best)
//TODO HIGH test failover (stop a node during calculation, show that it completes regardless)
//TODO MEDIUM test IngiteCompute with and without .withAsync() preparation
//TODO MEDIUM demonstrate Affinity computation: 
		//explore creative data distribution to facilitate natural compute efficiencies (e.g., avoid storing adjacent wirecenters on same node)
		//IgniteCompute.affinityRun() or @CacheAffinityMapped annotation.  Affinity.mapKeysToNodes().
		//See Ignite Performance tips docs and the Affinity Colocation docs
//TODO verify how backup data nodes participate in affinity compute distribution
//TODO explore balancing compute resources by a priority marker
//TODO explore dynamically provisioning a compute cluster with necessary data, then compute on it
//TODO demonstrate wrapping the JobRequestIgniteComputeTask in a JobRequestIgniteCallable so even the task->job map/split and/or node provisioning happens remotely
	
	@Test
	public void testSubmitComputeTaskOnString() throws InterruptedException, ExecutionException {
		ComputeTaskSplitAdapter<String, Integer> testCompute = new ComputeTaskSplitAdapter<String, Integer>() {

			private static final long serialVersionUID = 1L;
			
		    //@LoadBalancerResource
		    //private ComputeLoadBalancer balancer; //can inject or construct a load balancer..interesting with custom affinity situations

			//NOTE: if we will not use the arg, can declare ComputeTaskSplitAdapter<Void,R> and split(int gridSize, Void arg)
			@Override
			protected Collection<TestComputeJob> split(int gridSize, String arg) throws IgniteException {
				//gridSize reasonable initial size, or look at args and determine how many jobs to put onto grid where jobCount!=gridSize
				System.out.println("ComputeTaskSplitAdapter creating compute jobs for: " + arg);
				List<TestComputeJob> jobs = new ArrayList<TestComputeJob>(gridSize);
				String[] tokens = arg.trim().split("\\s"); //split on whitespace
				for (String token : tokens) {
					jobs.add(new TestComputeJob(token));
				}
				System.out.println("Created " + jobs.size() + " jobs.");
				return jobs; //load balancer is applied automatically with ComputeTaskSplitAdapter, see ComputeTaskAdapter for manual balancing
			}

			@Override
			public Integer reduce(List<ComputeJobResult> results) throws IgniteException {
				System.out.println("Reducing results: " + results);
				int aggregateLength = 0;
				for (ComputeJobResult computeJobResult : results) {
					Integer aResult = computeJobResult.getData();
					if (null != aResult) aggregateLength += aResult;
				}
				return aggregateLength;
			}
			
		};
		String computeString = "Now is the time for all good persons to come to the aid of their cluster.";
		Job<Integer> computeJob = js.submit(new JobRequestIgniteComputeTask<String,Integer>(user1, igniteGrid.compute().withAsync(), testCompute, computeString));

		Integer result = computeJob.get();
		
		assertEquals(result.intValue(), 58);
	}
	
	@Test
	public void testSubmitCallableOfT() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new JobRequestIgniteCallable<Integer>(user1, igniteGrid.compute(), new TestCallable<>(duration, result)));

		assertEquals(result, job.get().intValue());

		wait(js);

		successfulJobChecks(duration, null, job);
	}

	@Test
	public void testSubmitCallableOfTExecutorService() throws InterruptedException, ExecutionException {
		final int result = 5;
		final int duration = 1000;
		Job<Integer> job = js.submit(new JobRequestIgniteCallable<Integer>(user2, TestJobService.igniteGrid.compute(), new TestCallable<>(duration, result)));
		
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

		Job<Integer> job = js.submit(new JobRequestIgniteCallable<Integer>(user2, TestJobService.igniteGrid.compute(), new TestCallable<>(duration, result)).setMetaIdentifiers(meta));
		
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

class TestComputeJob extends ComputeJobAdapter {
	private static final long serialVersionUID = 1L;
	
	TestComputeJob(String stringArg) {
		super(stringArg);
	}

	@Override
	public Integer execute() throws IgniteException {
		Integer result = null;
		if (this.isCancelled()) {
			System.out.println("TestComputeJob cancelled.");
			return null;
		}
		String arg = this.argument(0);
		System.out.println("TestComputeJob Computing length of " + arg);
		result = arg.length();
		return result;
	}
	
}

class TestCallable<T> implements IgniteCallable<T> {
	private static final long serialVersionUID = 1L;
	
	long	delay;
	boolean	fail;
	T		result = null;

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
		System.out.println("Executing " + TestCallable.this);
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

