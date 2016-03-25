package com.altvil.aro.service.entity;

public class Pair<T> {

	private T head;
	private T tail;

	public Pair(T head, T tail) {
		super();
		this.head = head;
		this.tail = tail;
	}

	public T getHead() {
		return head;
	}

	public T getTail() {
		return tail;
	}

}
