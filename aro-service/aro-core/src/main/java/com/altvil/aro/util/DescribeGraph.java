package com.altvil.aro.util;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.slf4j.Logger;

import com.altvil.aro.service.graph.node.GraphNode;

public class DescribeGraph {
	static Method		  source;
	static Method		  target;
	private static Method weight;
	static {
		try {
			source = DefaultEdge.class.getDeclaredMethod("getSource");
			target = DefaultEdge.class.getDeclaredMethod("getTarget");
			weight = DefaultWeightedEdge.class.getDeclaredMethod("getWeight");
			source.setAccessible(true);
			target.setAccessible(true);
			weight.setAccessible(true);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static <V extends GraphNode, E extends DefaultWeightedEdge> void debug(Logger logger, Graph<V, E> graph) {
		if (logger.isDebugEnabled()) {
			log((m) ->logger.debug(m), graph);
		}
	}

	public static <V extends GraphNode, E extends DefaultWeightedEdge> void info(Logger logger, Graph<V, E> graph) {
		if (logger.isInfoEnabled()) {
			log((m) ->logger.info(m), graph);
		}
	}

	private static <V extends GraphNode, E extends DefaultWeightedEdge> void log(Consumer<String> out, Graph<V, E> graph) {
		Set<V> leafNodes = new HashSet<>();
		Set<V> branchNodes = new HashSet<>();

		double totalLength = 0;

		for (DefaultWeightedEdge edge : graph.edgeSet()) {
			totalLength += weightOf(edge);
			V source = sourceOf(edge);
			V target = targetOf(edge);

			if (!branchNodes.contains(source)) {
				leafNodes.add(source);
			}
			leafNodes.remove(target);
			branchNodes.add(target);
		}

		for (V source : leafNodes) {
			StringBuilder bldr = new StringBuilder();
			log(out, graph, source, bldr);
		}
		out.accept("Total Length = " + totalLength);
	}

	private static <V extends GraphNode, E extends DefaultWeightedEdge> void log(Consumer<String> out, Graph<V, E> graph,
			V source, StringBuilder bldr) {
		bldr.append(source);

		List<E> edges = new ArrayList<>(graph.edgesOf(source));
		for (Iterator<E> itr = edges.iterator(); itr.hasNext();) {
			if (sourceOf(itr.next()) != source) {
				itr.remove();
			}
		}

		switch (edges.size()) {
		case 0:
			out.accept(bldr.toString());
			break;
		case 1:
			bldr.append("->");
			log(out, graph, targetOf(edges.get(0)), bldr);
			break;
		default:
			bldr.append("->");

			for (E edge : edges) {
				log(out, graph, targetOf(edge), new StringBuilder().append(bldr));
			}
		}
	}

	@SuppressWarnings("unchecked")
	private static <V extends GraphNode, E extends DefaultWeightedEdge> V sourceOf(E edge) {
		try {
			return (V) source.invoke(edge);
		} catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
			throw new IllegalStateException(e);
		}
	}

	@SuppressWarnings("unchecked")
	private static <V extends GraphNode, E extends DefaultWeightedEdge> V targetOf(E edge) {
		try {
			return (V) target.invoke(edge);
		} catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
			throw new IllegalStateException(e);
		}
	}

	public static <V extends GraphNode, E extends DefaultWeightedEdge> void trace(Logger logger, Graph<V, E> graph) {
		if (logger.isTraceEnabled()) {
			log((m) ->logger.trace(m), graph);
		}
	}

	private static <V extends GraphNode, E extends DefaultWeightedEdge> double weightOf(E edge) {
		try {
			return (double) weight.invoke(edge);
		} catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
			throw new IllegalStateException(e);
		}
	}
}
