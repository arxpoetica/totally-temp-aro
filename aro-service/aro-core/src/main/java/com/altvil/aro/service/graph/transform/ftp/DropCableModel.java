package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.UnitUtils;

public class DropCableModel {
	
	private static final Logger log = LoggerFactory
			.getLogger(DropCableModel.class.getName());

	
	
	public static DropCableModel create(Collection<DropCable> dropCables) {
		return new DropCableModel(dropCables) ;
	}
	
	public static DropCableModel createDropCableModel(Collection<Double> lengths) {
		return create(StreamUtil.map(lengths, DropCable::new)) ;
	}
	
	public static DropCableModel createDropCableModel(double length, double ... lengths) {
		List<Double> result = new ArrayList<>() ;
		result.add(length) ;
		for(double l : lengths) {
			result.add(l) ;
		}
		return createDropCableModel(result) ;
	}
	
	public static DropCableModel DEFAULT_MODEL = 
			createDropCableModel(
					UnitUtils.toMeters(50),
					UnitUtils.toMeters(100),
					UnitUtils.toMeters(150),
					UnitUtils.toMeters(500),
					UnitUtils.toMeters(1000),
					UnitUtils.toMeters(1500)) ;
	
	private final List<DropCable> dropCables ;
	private final double[] dropLengths;
	
	private DropCableModel(Collection<DropCable> dropCables) {
		this.dropCables = new ArrayList<>(dropCables);
		Collections.sort(this.dropCables);

		dropLengths = new double[dropCables.size()];
		int i = 0;
		for (DropCable dc : dropCables) {
			assert i == 0 || dropLengths[i] < dc.getLength() : "Cable lengths in model must be unique.";
			dropLengths[i++] = dc.getLength();
		}

	}

	public Collection<DropCable> getDropCableTypes() {
		return dropCables;
	}

	// TODO HARRY Should we have a getMaxLength method in DropCableModel to use
	// in the algorithm that is laying out the splitters. That way it should be
	// impossible for the layout to ever request a drop cable longer than what
	// the model supports.

	public DropCable getDropCable(double length) {
		assert length > 0 : "Drop cables must have a positive length.";

		int index = Arrays.binarySearch(dropLengths, length);

		if (index < 0) {
			index = -index - 1;

			if( index >= dropLengths.length ) {
				index = dropLengths.length  -1 ;
				log.info("Drop Cable Model violated : length=" + length);
			}
			
		}
		
		

		return dropCables.get(index);
	}
}
