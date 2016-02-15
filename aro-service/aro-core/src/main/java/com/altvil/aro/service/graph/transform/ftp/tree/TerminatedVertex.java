package com.altvil.aro.service.graph.transform.ftp.tree;

import java.util.ArrayList;
import java.util.List;

public class TerminatedVertex {

	public static Builder build() {
		return new Builder() ;
	}
	
	public static class Builder {
		private TerminatedVertex terminatedVertex = new TerminatedVertex();

		public Builder close(VertexStream stream) {
			this.terminatedVertex.terminatedStreams.add(stream) ;
			return this;
		}
		
		public Builder setRemainder(VertexStream remainder) {
			terminatedVertex.vertexStream = remainder ;
			return this ;
		}
		
		public Builder addTerminatedEdgeStream(EdgeStream stream) {
			this.terminatedVertex.terminatedStreams.add(stream) ;
			return this ;
		}
		
		public Builder add(LocationStream ls) {
			this.terminatedVertex.terminatedStreams.add(ls) ;
			return this ;
		}
		
		public TerminatedVertex build() {
			return terminatedVertex ;
		}

	}

	private VertexStream vertexStream;
	private List<LocationStream> terminatedStreams = new ArrayList<>();

	private TerminatedVertex() {
		
	}

	public VertexStream getVertexStream() {
		return vertexStream;
	}

	public List<LocationStream> getTerminatedStreams() {
		return terminatedStreams;
	}

}
