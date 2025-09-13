import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-application-name': 'tourist-safety-backend'
    }
  }
});

// Database service functions
export class SupabaseService {
  // Tourist operations
  static async createTourist(tourist: any) {
    const { data, error } = await supabase
      .from('tourists')
      .insert(tourist)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTouristById(id: string) {
    const { data, error } = await supabase
      .from('tourists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAllTourists() {
    const { data, error } = await supabase
      .from('tourists')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async updateTourist(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tourists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Alert operations
  static async createAlert(alert: any) {
    const { data, error } = await supabase
      .from('alerts')
      .insert(alert)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getAlerts(filters?: any) {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('createdAt', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.touristId) {
      query = query.eq('touristId', filters.touristId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async updateAlert(id: string, updates: any) {
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Location operations
  static async saveLocation(location: any) {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTouristLocations(touristId: string, limit = 100) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('touristId', touristId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getLatestLocation(touristId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('touristId', touristId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  }

  // Geofence operations
  static async createGeofence(geofence: any) {
    const { data, error } = await supabase
      .from('geofences')
      .insert(geofence)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getGeofences() {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async updateGeofence(id: string, updates: any) {
    const { data, error } = await supabase
      .from('geofences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  static subscribeToAlerts(callback: (payload: any) => void) {
    return supabase
      .channel('alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, callback)
      .subscribe();
  }

  static subscribeToLocations(callback: (payload: any) => void) {
    return supabase
      .channel('locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, callback)
      .subscribe();
  }
}

export default SupabaseService;