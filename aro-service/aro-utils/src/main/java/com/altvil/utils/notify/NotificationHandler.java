package com.altvil.utils.notify;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NotificationHandler<L, E> {

	private static final Logger log = LoggerFactory
			.getLogger(NotificationHandler.class.getName());

	public interface EventDistpatcher<L, E> {
		void dispatch(L listener, E event);
	}

	private EventDistpatcher<L, E> eventDistaptcher;

	private List<L> listeners = new ArrayList<>();
	private ExecutorService executorService = Executors
			.newSingleThreadExecutor();

	public NotificationHandler(EventDistpatcher<L, E> eventDistaptcher) {
		super();
		this.eventDistaptcher = eventDistaptcher;
	}

	public synchronized void addListener(L listener) {
		listeners.add(listener);
	}

	public synchronized void removeListener(L listener) {
		listeners.remove(listener);
	}

	private synchronized Collection<L> getListeners() {
		return new ArrayList<>(listeners);
	}

	protected void dispatch(L listener, E event) {
		executorService.execute(() -> {
			try {
				eventDistaptcher.dispatch(listener, event);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
			}
		});
	}

	public void notify(E event) {
		for (L listener : getListeners()) {
			dispatch(listener, event);
		}
	}

}
