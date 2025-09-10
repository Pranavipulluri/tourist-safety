-- Initialize PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_tourist_timestamp ON locations(tourist_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST(ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_alerts_tourist_timestamp ON alerts(tourist_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON alerts(type, severity);
CREATE INDEX IF NOT EXISTS idx_geofences_coordinates ON geofences USING GIST(ST_GeomFromGeoJSON(coordinates::text));

-- Create function for calculating distance
CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
RETURNS float AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromWKB(ST_AsBinary(ST_Point(lon1, lat1))),
        ST_GeogFromWKB(ST_AsBinary(ST_Point(lon2, lat2)))
    );
END;
$$ LANGUAGE plpgsql;

-- Create function for geofence checking
CREATE OR REPLACE FUNCTION check_point_in_geofence(point_lat float, point_lon float, fence_coords json)
RETURNS boolean AS $$
BEGIN
    RETURN ST_Contains(
        ST_GeomFromGeoJSON(fence_coords::text),
        ST_Point(point_lon, point_lat)
    );
END;
$$ LANGUAGE plpgsql;