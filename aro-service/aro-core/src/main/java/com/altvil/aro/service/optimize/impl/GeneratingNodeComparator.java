package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.optimize.model.GeneratingNode;

import java.util.Comparator;

public class GeneratingNodeComparator implements Comparator<GeneratingNode> {

    public static Comparator<GeneratingNode> COMPARATROR = new GeneratingNodeComparator();

    @Override
    public int compare(GeneratingNode o1, GeneratingNode o2) {
        return o1.getFiberAssignment().getFiberType()
                .compareTo(o2.getFiberAssignment().getFiberType());
    }

}
