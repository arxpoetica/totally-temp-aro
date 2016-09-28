package com.altvil.netop.processing;

public class ServiceLayerCommand {
    private CommandAction action;
    double maxDistanceMeters;

    public CommandAction getAction() {
        return action;
    }

    public void setAction(CommandAction action) {
        this.action = action;
    }

    public double getMaxDistanceMeters() {
        return maxDistanceMeters;
    }

    public void setMaxDistanceMeters(double maxDistanceMeters) {
        this.maxDistanceMeters = maxDistanceMeters;
    }

    public enum  CommandAction {
        GENERATE_POLYGONS
    }
}
