package com.altvil.utils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public class StreamUtil {

	public static <T> Stream<T> asStream(Iterator<T> itr) {
		return StreamSupport.stream(
				Spliterators.spliteratorUnknownSize(itr, Spliterator.ORDERED),
				false);
	}

	@SafeVarargs
	public static <T> Set<T> asSet(T ... values) {
		Set<T> result = new HashSet<>(values.length) ;
		for(T v : values) {
			result.add(v) ;
		}
		return result ;
	}
	
	public static <T> List<T> asList(T[] source) {
		List<T> result = new ArrayList<T>(source.length);

		for (T v : source) {
			result.add(v);
		}

		return result;
	}

	public static <K, V> Map<K, V> hash(Collection<? extends V> src, Function<V, K> f) {
		HashMap<K, V> result = new HashMap<K, V>(src.size());

		for (V v : src) {
			result.put(f.apply(v), v);
		}

		return result;
	}

	public static <T> List<T> toList(T[] values) {
		List<T> result = new ArrayList<T>(values.length) ;
		
		for(T v : values) {
			result.add(v) ;
		}
		
		return result ;
	}
	
	public static <T> List<T> filter(Collection<T> values,
			Predicate<T> predicate) {
		return values.stream().filter(predicate).collect(Collectors.toList());
	}

	public static <T> List<T> asList(T value) {
		List<T> list = new ArrayList<>();
		list.add(value);
		return list;
	}

	public static <T, D> List<D> map(Collection<T> src, Function<T, D> function) {
		List<D> result = new ArrayList<D>(src.size());

		for (T v : src) {
			result.add(function.apply(v));
		}

		return result;
	}
	
	public static <T, D> Set<D> mapSet(Collection<T> src, Function<T, D> function) {
		Set<D> result = new HashSet<D>(src.size());

		for (T v : src) {
			result.add(function.apply(v));
		}

		return result;
	}

	public static <T> List<T> asImmutableList(Collection<T> value) {
		return value instanceof List ? (List<T>) value
				: new ArrayList<T>(value);
	}

	public static <T, D> List<D> map(T[] src, Function<T, D> function) {
		List<D> result = new ArrayList<D>(src.length);

		for (T v : src) {
			result.add(function.apply(v));
		}

		return result;

	}

}
