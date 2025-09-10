import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeospatialFunctions1694567890124 implements MigrationInterface {
    name = 'AddGeospatialFunctions1694567890124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create function for calculating distance between two points
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
            RETURNS float AS $$
            BEGIN
                RETURN ST_Distance(
                    ST_GeogFromWKB(ST_AsBinary(ST_Point(lon1, lat1))),
                    ST_GeogFromWKB(ST_AsBinary(ST_Point(lon2, lat2)))
                );
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create function for checking if point is within geofence
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION check_point_in_geofence(point_lat float, point_lon float, fence_coords json)
            RETURNS boolean AS $$
            DECLARE
                geom geometry;
            BEGIN
                -- Convert JSON coordinates to PostGIS geometry
                SELECT ST_GeomFromGeoJSON(fence_coords::text) INTO geom;
                
                -- Check if point is within the geometry
                RETURN ST_Contains(geom, ST_Point(point_lon, point_lat));
            EXCEPTION
                WHEN OTHERS THEN
                    RETURN FALSE;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create function to find nearby tourists
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION find_nearby_tourists(center_lat float, center_lon float, radius_meters float)
            RETURNS TABLE(tourist_id uuid, distance float, last_location_time timestamp) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    l.tourist_id,
                    calculate_distance(center_lat, center_lon, l.latitude::float, l.longitude::float) as distance,
                    l.timestamp as last_location_time
                FROM locations l
                INNER JOIN (
                    SELECT tourist_id, MAX(timestamp) as max_timestamp
                    FROM locations
                    GROUP BY tourist_id
                ) latest ON l.tourist_id = latest.tourist_id AND l.timestamp = latest.max_timestamp
                WHERE calculate_distance(center_lat, center_lon, l.latitude::float, l.longitude::float) <= radius_meters
                ORDER BY distance;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create function to get location heatmap data
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION get_location_heatmap(start_time timestamp, end_time timestamp)
            RETURNS TABLE(lat decimal, lng decimal, weight bigint) AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    ROUND(l.latitude, 3) as lat,
                    ROUND(l.longitude, 3) as lng,
                    COUNT(*) as weight
                FROM locations l
                WHERE l.timestamp BETWEEN start_time AND end_time
                GROUP BY ROUND(l.latitude, 3), ROUND(l.longitude, 3)
                HAVING COUNT(*) > 1
                ORDER BY weight DESC;
            END;
            $$ LANGUAGE plpgsql;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP FUNCTION IF EXISTS get_location_heatmap(timestamp, timestamp)`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS find_nearby_tourists(float, float, float)`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS check_point_in_geofence(float, float, json)`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_distance(float, float, float, float)`);
    }
}