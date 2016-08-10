package com.altvil.aro.service.cu.execute;

import java.util.Comparator;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class PriorityThreadPoolExecutor extends ThreadPoolExecutor {

	public PriorityThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
			long keepAliveTime, TimeUnit unit, RejectedExecutionHandler handler) {
		super(corePoolSize, maximumPoolSize, keepAliveTime, unit,
				new PriorityBlockingQueue<Runnable>(10,
						PriorityComparator.COMPARATOR), handler);
	}

	public PriorityThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
			long keepAliveTime, TimeUnit unit, ThreadFactory threadFactory,
			RejectedExecutionHandler handler) {
		super(corePoolSize, maximumPoolSize, keepAliveTime, unit,
				new PriorityBlockingQueue<Runnable>(10,
						PriorityComparator.COMPARATOR), threadFactory, handler);
	}

	public PriorityThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
			long keepAliveTime, TimeUnit unit, ThreadFactory threadFactory,
			Priority priority) {
		super(corePoolSize, maximumPoolSize, keepAliveTime, unit,
				new PriorityBlockingQueue<Runnable>(10,
						PriorityComparator.COMPARATOR), threadFactory);
	}

	public PriorityThreadPoolExecutor(int corePoolSize, int maximumPoolSize,
			long keepAliveTime, TimeUnit unit) {
		super(corePoolSize, maximumPoolSize, keepAliveTime, unit,
				new PriorityBlockingQueue<Runnable>(10,
						PriorityComparator.COMPARATOR));
	}

	protected <T> RunnableFuture<T> newTaskFor(Priority priority,
			Runnable runnable, T value) {
		return new PriorityFutureTask<T>(runnable, value, priority);
	}

	protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
		return new PriorityFutureTask<T>(runnable, value, Priority.LOW);
	}

	public Future<?> submit(Priority priority, Runnable task) {
		if (task == null)
			throw new NullPointerException();
		RunnableFuture<Void> ftask = newTaskFor(priority, task, null);
		execute(ftask);
		return ftask;
	}

	protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable,
			Priority priority) {
		return new PriorityFutureTask<T>(callable, priority);
	}

	public <T> Future<T> submit(Priority priority, Callable<T> task) {
		if (task == null)
			throw new NullPointerException();
		RunnableFuture<T> ftask = newTaskFor(task, priority);
		execute(ftask);
		return ftask;
	}

	@Override
	protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
		throw new UnsupportedOperationException();
	}

	@Override
	public Future<?> submit(Runnable task) {
		throw new UnsupportedOperationException();
	}

	@Override
	public <T> Future<T> submit(Runnable task, T result) {
		throw new UnsupportedOperationException();
	}

	@Override
	public <T> Future<T> submit(Callable<T> task) {
		throw new UnsupportedOperationException();
	}

	public interface PriortizedRunnable extends Runnable {
		public Priority getPriority();
	}

	protected static class PriorityFutureTask<T> extends FutureTask<T>
			implements PriortizedRunnable {

		private Priority priority;

		public PriorityFutureTask(Callable<T> callable, Priority priority) {
			super(callable);
			this.priority = priority;
		}

		public PriorityFutureTask(Runnable runnable, T result, Priority priority) {
			super(runnable, result);
			this.priority = priority;
		}

		public Priority getPriority() {
			return priority;
		}

	}

	private static class PriorityComparator implements Comparator<Runnable> {

		public static Comparator<Runnable> COMPARATOR = new PriorityComparator();

		@Override
		public int compare(Runnable o1, Runnable o2) {
			return ((PriortizedRunnable) o2).getPriority().compareTo(
					((PriortizedRunnable) o1).getPriority());
		}

	}

	private static void preload(PriorityThreadPoolExecutor executor,
			Priority priority) {
		for (int i = 0; i < 10; i++) {
			executor.submit(priority, () -> {
				try {
					Thread.sleep(1000);
				} catch (Exception e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				System.out.println(priority.name());
			});
		}

	}

	public static void main(String[] args) {
		PriorityThreadPoolExecutor executor = new PriorityThreadPoolExecutor(1,
				1, 1000L, TimeUnit.SECONDS);

		preload(executor, Priority.LOW);
		preload(executor, Priority.MEDIUM);
		preload(executor, Priority.HIGH);

		for (;;) {
			try {
				Thread.sleep(1000L);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

	}

}
