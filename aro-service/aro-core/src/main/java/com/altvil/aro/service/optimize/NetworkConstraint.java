package com.altvil.aro.service.optimize;

import com.altvil.aro.service.optimize.spi.NetworkAnalysis;

public interface NetworkConstraint {
    boolean isConstraintMet(NetworkAnalysis analysis);
}
