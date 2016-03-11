package com.altvil.aro.model;

public enum NetworkNodeType {
	
	central_office(1),
	splice_point(2),
	fiber_distribution_hub(3),
	fiber_distribution_terminal(4),
	bulk_distrubution_terminal(5),
	bulk_distribution_consumer(6)

	;
	
	int id ;
	
	private NetworkNodeType(int id) {
		this.id = id ;
	}
	
	public int getId() {
		return id ;
	}

}
