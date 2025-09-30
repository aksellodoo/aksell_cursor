import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Utility function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

// Constants
const BATCH_SIZE = 25; // Cities per Distance Matrix API call
const GEOCODING_BATCH_SIZE = 5; // Cities to geocode per tick (reduced for timeout safety)
const MAX_CITIES_PER_REQUEST = 2000; // Total limit for safety
const TICK_TIMEOUT_MS = 20000; // 20 seconds budget per tick

// Retry configuration
const MAX_RETRIES = 3; // Maximum retry attempts for 5xx errors
const RETRY_DELAY_BASE = 1000; // Base delay in ms for exponential backoff
const RETRY_5XX_CODES = [500, 502, 503, 504]; // HTTP codes to retry

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-action, x-city-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Google Distance Matrix API response structure
interface GoogleDistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: {
        value: number; // meters
      };
      duration?: {
        value: number; // seconds
      };
      duration_in_traffic?: {
        value: number; // seconds with traffic
      };
    }>;
  }>;
}

// Google Geocoding API response structure
interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    place_id: string;
    formatted_address: string;
    types?: string[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

interface DistanceJobData {
  id: string;
  status: string;
  phase: string;
  total_cities: number;
  processed_cities: number;
  geocoded_cities: number;
  created_by: string;
  mode?: string;
  only_fill_empty?: boolean;
}

// Constants
const INDAIATUBA_COORDS = '-23.0816,-47.2100';
const GEOCODING_TIMEOUT = 10000; // 10 seconds per city
const MATRIX_TIMEOUT = 30000; // 30 seconds per batch

// Retry operation with exponential backoff for 5xx errors
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  attempt: number = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const status = (error as any).status;
    const isRetryableError = status && RETRY_5XX_CODES.includes(status);
    const isNetworkError = (error instanceof Error && error.name === 'TypeError') && (error instanceof Error && error.message.includes('fetch'));
    
    if ((isRetryableError || isNetworkError) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt); // Exponential backoff
      console.log(`${operationName} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms. Error: ${error instanceof Error ? error.message : String(error)}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, operationName, attempt + 1);
    } else {
      // Add retry information to error for logging
      (error as any).retryAttempts = attempt;
      (error as any).wasRetried = attempt > 0;
      
      if (attempt >= MAX_RETRIES) {
        console.error(`${operationName} failed after ${attempt + 1} attempts. Final error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      throw error;
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get data from multiple sources to avoid "Body already consumed" error
    let action: string | null = null;
    let cityId: string | null = null;
    let onlyFillEmpty = false;
    let mode: string | null = null;
    let jobId: string | null = null;
    let userId: string | null = null;
    let dataSource = 'unknown';

    // 1. Try headers first
    action = req.headers.get('x-action');
    cityId = req.headers.get('x-city-id');
    
    if (action) {
      dataSource = 'headers';
      console.log(`Data from headers - action: ${action}, cityId: ${cityId}`);
    }

    // 2. Try query parameters as fallback
    if (!action) {
      const url = new URL(req.url);
      action = url.searchParams.get('action');
      cityId = url.searchParams.get('cityId');
      
      if (action) {
        dataSource = 'query';
        console.log(`Data from query - action: ${action}, cityId: ${cityId}`);
      }
    }

    // 3. Try body as last resort (within try/catch to handle "Body already consumed")
    if (!action) {
      try {
        const body = await req.json();
        action = body.action;
        cityId = body.cityId;
        onlyFillEmpty = body.onlyFillEmpty || false;
        mode = body.mode; // New mode parameter
        jobId = body.jobId;
        userId = body.userId;
        dataSource = 'body';
        console.log(`Data from body - action: ${action}, cityId: ${cityId}, mode: ${mode}`);
        
        // Convert mode to onlyFillEmpty for backward compatibility
        if (mode) {
          onlyFillEmpty = mode === 'fill_empty';
        }
      } catch (bodyError) {
        console.error('Failed to parse request body:', bodyError instanceof Error ? bodyError.message : String(bodyError));
        // Continue with values from headers/query if available
      }
    }

    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing action parameter',
          context: 'Parâmetro action não encontrado em headers, query ou body'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Distance matrix function called with action: ${action} (source: ${dataSource})`);
    
    // Service role client for system operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle admin tick action (called by worker with service role)
    if (action === 'tick_admin') {
      if (!jobId) {
        throw new Error('jobId required for tick_admin action');
      }
      const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured');
      }
      return await processTickAdmin(supabaseAdmin, jobId, GOOGLE_MAPS_API_KEY);
    }

    // For other actions, require user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user info
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User authentication failed: ' + (userError?.message || 'Unknown error'));
    }

    switch (action) {
      case 'start':
        return await startDistanceCalculation(supabaseAdmin, user.id, onlyFillEmpty, mode);
      
      case 'tick':
        const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error('GOOGLE_MAPS_API_KEY not configured');
        }
        return await processTickForUser(supabaseAdmin, user.id, GOOGLE_MAPS_API_KEY);
      
      case 'cancel':
        return await cancelDistanceCalculation(supabaseAdmin, user.id);
      
      case 'status':
        return await getJobStatus(supabaseUser, user.id);
      
      case 'refresh_city':
        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!GOOGLE_API_KEY) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'GOOGLE_MAPS_API_KEY not configured',
              context: 'Configure a chave do Google Maps nas funções do Supabase'
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return await refreshSingleCity(supabaseAdmin, { cityId }, GOOGLE_API_KEY);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in city-distance-matrix function:', error);
    
    // Safely extract error message
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object' && 'message' in err) {
        return String((err as any).message);
      }
      return String(err);
    };
    
    // Return business errors with 200 status for better frontend handling
    const errorMessage = getErrorMessage(error);
    if (errorMessage?.includes('GOOGLE_MAPS_API_KEY') || 
        errorMessage?.includes('REQUEST_DENIED') ||
        errorMessage?.includes('OVER_DAILY_LIMIT')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage,
          context: 'Erro de configuração ou limite da API'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Unexpected errors still return 500
    return new Response(
      JSON.stringify({ 
        success: false,
        error: getErrorMessage(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function refreshSingleCity(
  supabaseAdmin: any,
  requestData: any,
  googleApiKey: string
) {
  const { cityId } = requestData;
  
  if (!cityId) {
    throw new Error('cityId is required');
  }

  console.log(`Refreshing data for city ${cityId}`);

  // Get city data
  const { data: city, error: cityError } = await supabaseAdmin
    .from('site_cities')
    .select('id, name, uf, country')
    .eq('id', cityId)
    .single();

  if (cityError || !city) {
    throw new Error(`City not found: ${cityError?.message || 'Unknown error'}`);
  }

  // Build address string
  const country = city.country || 'Brasil';
  const address = `${city.name}, ${city.uf}, ${country}`;

  try {
    // Step 1: Geocode the city
    console.log(`Geocoding city: ${address}`);
    const geocoded = await retryOperation(
      () => geocodeCity(city.name, city.uf, googleApiKey, country),
      `Geocoding ${city.name}`,
      0
    );

    let updateData: any = {};

    if (geocoded) {
      updateData.latitude = geocoded.latitude;
      updateData.longitude = geocoded.longitude;
      updateData.g_place_id = geocoded.place_id;
      updateData.g_formatted_address = geocoded.formatted_address;

      // Step 2: Calculate distance and travel time using Google Distance Matrix
      console.log(`Calculating distance for ${city.name}`);
      const destinations = `${geocoded.latitude},${geocoded.longitude}`;
      
      try {
        const matrixResult = await retryOperation(
          () => calculateDistanceMatrix([destinations], googleApiKey),
          `Distance Matrix for ${city.name}`,
          0
        );

        if (matrixResult && matrixResult.rows?.[0]?.elements?.[0]) {
          const element = matrixResult.rows[0].elements[0];
          
          if (element.status === 'OK' && element.distance && element.duration) {
            const distanceKm = element.distance.value / 1000;
            const carTimeHours = element.duration.value / 3600;
            const truckTimeHours = Math.round(carTimeHours * 1.25 * 100) / 100; // Round to 2 decimal places

            updateData.distance_km_to_indaiatuba = distanceKm;
            updateData.average_truck_travel_time_hours = truckTimeHours;
            updateData.distance_source = 'matrix';
            updateData.route_unavailable = false;
            updateData.route_status = 'OK';
            
            console.log(`Google route found: ${distanceKm}km, ${truckTimeHours}h truck time`);
          } else {
            // Route not available, use Haversine distance
            console.log(`Google route unavailable (${element.status}), using Haversine distance`);
            const haversineDistance = calculateHaversineDistance(
              geocoded.latitude,
              geocoded.longitude,
              -23.0816, // Indaiatuba latitude
              -47.2100  // Indaiatuba longitude
            );

            updateData.distance_km_to_indaiatuba = haversineDistance;
            updateData.average_truck_travel_time_hours = null;
            updateData.distance_source = 'haversine';
            updateData.route_unavailable = true;
            updateData.route_status = element.status;
          }
        }
      } catch (matrixError) {
        console.error(`Distance Matrix error for ${city.name}:`, matrixError);
        // Fallback to Haversine if Matrix API fails
        const haversineDistance = calculateHaversineDistance(
          geocoded.latitude,
          geocoded.longitude,
          -23.0816, // Indaiatuba latitude
          -47.2100  // Indaiatuba longitude
        );

        updateData.distance_km_to_indaiatuba = haversineDistance;
        updateData.average_truck_travel_time_hours = null;
        updateData.distance_source = 'haversine';
        updateData.route_unavailable = true;
        updateData.route_status = 'MATRIX_API_ERROR';
      }
    } else {
      throw new Error('Geocoding failed - no coordinates found');
    }

    // Update the city
    const { error: updateError } = await supabaseAdmin
      .from('site_cities')
      .update(updateData)
      .eq('id', cityId);

    if (updateError) {
      throw new Error(`Failed to update city: ${updateError.message}`);
    }

    console.log(`Successfully refreshed data for ${city.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Dados atualizados com sucesso para ${city.name}`,
        data: updateData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error(`Error refreshing city ${city.name}:`, error);
    
    // Return business errors with 200 status and detailed context
    let errorContext = 'Erro geral';
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage?.includes('REQUEST_DENIED')) {
      errorContext = 'API do Google Maps: Acesso negado - verifique a chave e permissões';
      errorMessage = 'Acesso negado à API do Google Maps';
    } else if (errorMessage?.includes('OVER_DAILY_LIMIT')) {
      errorContext = 'API do Google Maps: Limite diário excedido';
      errorMessage = 'Limite diário da API do Google Maps foi excedido';
    } else if (errorMessage?.includes('ZERO_RESULTS')) {
      errorContext = 'Geocoding: Cidade não encontrada';
      errorMessage = 'Cidade não encontrada no Google Maps';
    } else if (errorMessage?.includes('Geocoding failed')) {
      errorContext = 'Erro de geocoding';
      errorMessage = 'Não foi possível encontrar as coordenadas da cidade';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Erro ao atualizar ${city.name}: ${errorMessage}`,
        context: errorContext,
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function startDistanceCalculation(
  supabaseAdmin: any,
  userId: string,
  onlyFillEmpty: boolean,
  mode?: string | null
) {
  // Check for existing running jobs
  const { data: existingJob } = await supabaseAdmin
    .from('site_city_distance_jobs')
    .select('id, status')
    .eq('created_by', userId)
    .in('status', ['queued', 'running'])
    .single();

  if (existingJob) {
    return new Response(
      JSON.stringify({ error: 'Já existe um job em execução' }),
      {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Count cities that need processing based on mode
  let countQuery = supabaseAdmin
    .from('site_cities')
    .select('*', { count: 'exact', head: true });

  if (mode === 'geocode_non_matrix') {
    // For geocode_non_matrix mode: count cities where distance_source is null, haversine, or pending_matrix
    countQuery = countQuery.or('distance_source.is.null,distance_source.eq.haversine,distance_source.eq.pending_matrix');
  } else if (onlyFillEmpty || mode === 'fill_empty') {
    countQuery = countQuery.or('latitude.is.null,longitude.is.null,distance_km_to_indaiatuba.is.null,average_truck_travel_time_hours.is.null');
  } else {
    // For overwrite mode: count cities that need geocoding (distance_source != 'matrix') 
    // or cities that need distance calculation (distance_km_to_indaiatuba is null)
    countQuery = countQuery.or('distance_source.neq.matrix,distance_km_to_indaiatuba.is.null');
  }

  const { count: totalCities, error: countError } = await countQuery;

  if (countError) {
    console.error('Count error details:', countError);
    throw new Error(`Erro ao contar cidades: ${getErrorMessage(countError)}`);
  }

  if (!totalCities || totalCities === 0) {
    return new Response(
      JSON.stringify({ message: 'Nenhuma cidade precisa ser processada' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Create job
  const { data: job, error: jobError } = await supabaseAdmin
    .from('site_city_distance_jobs')
    .insert({
      created_by: userId,
      status: 'running',
      only_fill_empty: onlyFillEmpty,
      mode: mode || (onlyFillEmpty ? 'fill_empty' : 'overwrite'),
      total_cities: totalCities,
      phase: 'geocoding',
      geocoded_cities: 0,
      processed_cities: 0,
      failed_cities: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError) {
    throw new Error(`Erro ao criar job: ${getErrorMessage(jobError)}`);
  }

  return new Response(
    JSON.stringify({ 
      message: 'Job iniciado com sucesso',
      jobId: job.id,
      totalCities
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function processTickForUser(
  supabaseAdmin: any,
  userId: string,
  googleApiKey: string
) {
  // Get active job for user
  const { data: job } = await supabaseAdmin
    .from('site_city_distance_jobs')
    .select('*')
    .eq('created_by', userId)
    .eq('status', 'running')
    .single();

  if (!job) {
    return new Response(
      JSON.stringify({ message: 'Nenhum job ativo encontrado' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return await processTickAdmin(supabaseAdmin, job.id, googleApiKey);
}

// Admin tick function for worker calls
async function processTickAdmin(supabase: any, jobId: string, googleApiKey: string): Promise<Response> {
  try {
    console.log(`Processing admin tick for job ${jobId}`);
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('site_city_distance_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'running')
      .single();

    if (jobError || !job) {
      console.log('No active job found or job error:', jobError);
      return new Response(
        JSON.stringify({ success: false, message: 'No active job found' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let result;
    if (job.phase === 'geocoding') {
      result = await processGeocodingTick(job, supabase, googleApiKey);
    } else if (job.phase === 'matrix') {
      result = await processMatrixTick(job, supabase, googleApiKey);
    } else {
      throw new Error(`Unknown phase: ${job.phase}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin tick:', error);
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function processGeocodingTick(job: DistanceJobData, supabase: any, googleApiKey: string): Promise<{ success: boolean; message: string; completed?: boolean }> {
  console.log(`Processing geocoding tick for job ${job.id}`);
  const startTime = Date.now();
  
  // Get cities that need geocoding based on job mode
  let geocodingQuery = supabase
    .from('site_cities')
    .select('id, name, uf, country, latitude, longitude, distance_km_to_indaiatuba, average_truck_travel_time_hours, distance_source')
    .limit(GEOCODING_BATCH_SIZE);

  if (job.mode === 'geocode_non_matrix') {
    // For geocode_non_matrix mode: geocode and immediately calculate distances for cities where distance_source is null, haversine, or pending_matrix
    // Order by distance descending (farthest cities first) for better processing prioritization
    geocodingQuery = geocodingQuery
      .or('distance_source.is.null,distance_source.eq.haversine,distance_source.eq.pending_matrix')
      .order('distance_km_to_indaiatuba', { ascending: false, nullsFirst: false });
  } else if (job.only_fill_empty || job.mode === 'fill_empty') {
    geocodingQuery = geocodingQuery.or('latitude.is.null,longitude.is.null');
  } else {
    // For overwrite mode: geocode cities where distance_source is null, haversine, or pending_matrix
    geocodingQuery = geocodingQuery.or('distance_source.is.null,distance_source.eq.haversine,distance_source.eq.pending_matrix');
  }

  const { data: cities, error: citiesError } = await geocodingQuery;

  if (citiesError) {
    console.error('Error fetching cities for geocoding:', citiesError);
    throw new Error(`Error fetching cities: ${getErrorMessage(citiesError)}`);
  }

  if (!cities || cities.length === 0) {
    console.log('No more cities to geocode');
    
    if (job.mode === 'geocode_non_matrix') {
      // For geocode_non_matrix mode, we're done - mark as completed
      const { error: updateError } = await supabase
        .from('site_city_distance_jobs')
        .update({ 
          status: 'completed',
          finished_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) {
        throw new Error(`Error completing job: ${updateError.message}`);
      }

      return { success: true, message: 'Geocoding and distance calculation completed', completed: true };
    } else {
      // For other modes, move to matrix phase
      const { error: updateError } = await supabase
        .from('site_city_distance_jobs')
        .update({ 
          phase: 'matrix',
          processed_cities: 0 // Reset for matrix phase
        })
        .eq('id', job.id);

      if (updateError) {
        throw new Error(`Error updating job phase: ${updateError.message}`);
      }

      return { success: true, message: 'Geocoding completed, moving to matrix phase' };
    }
  }

  // Process each city with timeout and cancellation checks
  const geocodedCities = [];
  for (const city of cities) {
    // Check for cancellation every city
    const { data: currentJob } = await supabase
      .from('site_city_distance_jobs')
      .select('status')
      .eq('id', job.id)
      .single();
    
    if (currentJob?.status === 'cancelled') {
      console.log('Job was cancelled, stopping geocoding');
      return { success: true, message: 'Job cancelled during geocoding' };
    }

    // Check timeout (20s budget)
    if (Date.now() - startTime > TICK_TIMEOUT_MS) {
      console.log('Geocoding tick timeout reached, will continue in next tick');
      break;
    }

    try {
      const geocoded = await geocodeCity(city.name, city.uf, googleApiKey, city.country);
      if (geocoded) {
        geocodedCities.push({
          id: city.id,
          name: city.name,
          uf: city.uf,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude
        });
      }
    } catch (error) {
      console.error(`Error geocoding city ${city.name}:`, error);
      await logCityError(supabase, job.id, city.id, city.name, 'geocoding', getErrorMessage(error), (error as any).retryAttempts || 0);
    }
  }

  if (job.mode === 'geocode_non_matrix') {
    // For geocode_non_matrix mode: immediately calculate distances after geocoding
    let successfullyProcessed = 0;

    if (geocodedCities.length > 0) {
      try {
        // Process distance calculation for geocoded cities using correct signature
        successfullyProcessed = await processBatch(supabase, job.id, geocodedCities, googleApiKey);
      } catch (error) {
        console.error('Error in batch processing:', error);
        // Still update with geocoded coordinates only
        for (const city of geocodedCities) {
          await supabase
            .from('site_cities')
            .update({
              latitude: city.latitude,
              longitude: city.longitude
            })
            .eq('id', city.id);
        }
      }
    }

    // Update job progress with clamped counters
    const newProcessedCount = Math.min(job.processed_cities + successfullyProcessed, job.total_cities);
    const newGeocodedCount = Math.min((job.geocoded_cities || 0) + geocodedCities.length, job.total_cities);
    
    await supabase
      .from('site_city_distance_jobs')
      .update({
        processed_cities: newProcessedCount,
        geocoded_cities: newGeocodedCount
      })
      .eq('id', job.id);

    return { success: true, message: `Geocoded and calculated distances for ${successfullyProcessed} cities` };
  } else {
    // For other modes: just geocode and mark as pending_matrix
    for (const city of geocodedCities) {
      await supabase
        .from('site_cities')
        .update({
          latitude: city.latitude,
          longitude: city.longitude,
          // Clear distance fields to force recalculation in matrix phase
          distance_km_to_indaiatuba: null,
          average_truck_travel_time_hours: null,
          distance_source: 'pending_matrix',
          route_unavailable: null,
          route_status: null
        })
        .eq('id', city.id);
    }

    // Update job progress and geocoded cities count
    const newProcessedCount = job.processed_cities + geocodedCities.length;
    const newGeocodedCount = (job.geocoded_cities || 0) + geocodedCities.length;
    await supabase
      .from('site_city_distance_jobs')
      .update({
        processed_cities: newProcessedCount,
        geocoded_cities: newGeocodedCount
      })
      .eq('id', job.id);

    return { success: true, message: `Geocoded ${geocodedCities.length} cities` };
  }
}

async function processMatrixTick(job: DistanceJobData, supabase: any, googleApiKey: string): Promise<{ success: boolean; message: string; completed?: boolean }> {
  console.log(`Processing matrix tick for job ${job.id}`);
  const startTime = Date.now();
  
  // Get cities that need distance calculation (have coordinates but no distance/time)
  // Include cities marked as 'pending_matrix' and exclude route_unavailable cities to prevent reprocessing
  const { data: cities, error: citiesError } = await supabase
    .from('site_cities')
    .select('id, name, uf, latitude, longitude, distance_km_to_indaiatuba, average_truck_travel_time_hours, route_unavailable, distance_source')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .neq('route_unavailable', true)
    .or('distance_km_to_indaiatuba.is.null,average_truck_travel_time_hours.is.null,distance_source.eq.pending_matrix')
    .limit(BATCH_SIZE);

  if (citiesError) {
    console.error('Error fetching cities for matrix calculation:', citiesError);
    throw new Error(`Error fetching cities: ${citiesError.message}`);
  }

  if (!cities || cities.length === 0) {
    console.log('No more cities need distance calculation, job completed');
    
    // Mark job as completed
    const { error: updateError } = await supabase
      .from('site_city_distance_jobs')
      .update({ 
        status: 'completed',
        finished_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      throw new Error(`Error marking job as completed: ${updateError.message}`);
    }

    return { success: true, message: 'Distance calculation completed', completed: true };
  }

  // Check for cancellation before processing
  const { data: currentJob } = await supabase
    .from('site_city_distance_jobs')
    .select('status')
    .eq('id', job.id)
    .single();
  
  if (currentJob?.status === 'cancelled') {
    console.log('Job was cancelled, stopping matrix calculation');
    return { success: true, message: 'Job cancelled during matrix calculation' };
  }

  // Process batch
  const successCount = await processBatch(supabase, job.id, cities, googleApiKey);

  // Update job progress with safety check to prevent overflow
  const newProcessedCount = Math.min(job.total_cities, job.processed_cities + successCount);
  await supabase
    .from('site_city_distance_jobs')
    .update({
      processed_cities: newProcessedCount
    })
    .eq('id', job.id);

  return { success: true, message: `Processed ${successCount} cities in matrix phase` };
}

async function geocodeCity(cityName: string, state: string, googleApiKey: string, country: string = 'Brasil'): Promise<{ latitude: number; longitude: number; place_id?: string; formatted_address?: string } | null> {
  const address = `${cityName}, ${state}, ${country}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=br&language=pt-BR&key=${googleApiKey}`;

  return await retryOperation(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEOCODING_TIMEOUT);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const result: GoogleGeocodeResponse = await response.json();
      
      if (result.status === 'OK' && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          place_id: result.results[0].place_id,
          formatted_address: result.results[0].formatted_address
        };
      } else {
        throw new Error(`Geocoding status: ${result.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Geocoding timeout after ${GEOCODING_TIMEOUT}ms`);
      }
      throw error;
    }
  }, `geocoding ${cityName}, ${state}`);
}

async function processBatch(
  supabase: any,
  jobId: string,
  cities: any[],
  googleApiKey: string
): Promise<number> {
  // Build destinations array
  const destinations = cities
    .filter(city => city.latitude && city.longitude)
    .map(city => `${city.latitude},${city.longitude}`);

  if (destinations.length === 0) {
    console.log('No valid destinations in batch');
    return 0;
  }

  try {
    const matrixResult = await calculateDistanceMatrix(destinations, googleApiKey);
    
    if (matrixResult?.status === 'OK' && matrixResult.rows.length > 0) {
      const elements = matrixResult.rows[0].elements;
      let successCount = 0;
      
      // Indaiatuba coordinates for Haversine fallback
      const indaiatubaLat = -23.0816;
      const indaiatubaLon = -47.2100;
      
      // Update cities with results
      for (let i = 0; i < Math.min(cities.length, elements.length); i++) {
        const city = cities[i];
        const element = elements[i];
        
        if (element.status === 'OK' && element.distance && element.duration) {
          const distanceKm = Math.round((element.distance.value / 1000) * 1000) / 1000;
          const carTimeHours = element.duration.value / 3600;
          const truckTimeHours = Math.round(carTimeHours * 1.25 * 100) / 100; // Apply 1.25 multiplier and round to 2 decimal places

            await supabase
              .from('site_cities')
              .update({
                distance_km_to_indaiatuba: distanceKm,
                average_truck_travel_time_hours: truckTimeHours,
                distance_source: 'matrix',
                route_unavailable: false,
                route_status: 'OK'
              })
              .eq('id', city.id);
          
          successCount++;
        } else if (element.status === 'ZERO_RESULTS' || element.status === 'NOT_FOUND') {
          // Use Haversine distance for cities without car routes
          if (city.latitude && city.longitude) {
            const haversineDistance = Math.round(calculateHaversineDistance(
              city.latitude, 
              city.longitude, 
              indaiatubaLat, 
              indaiatubaLon
            ) * 1000) / 1000; // Round to 3 decimal places
            
            await supabase
              .from('site_cities')
              .update({
                distance_km_to_indaiatuba: haversineDistance,
                average_truck_travel_time_hours: null, // No travel time for straight-line distance
                distance_source: 'haversine',
                route_unavailable: true,
                route_status: element.status
              })
              .eq('id', city.id);
              
            console.log(`Updated ${city.name} with Haversine: ${haversineDistance}km (no car route available)`);
            successCount++; // Count as successful since we handled it
          } else {
            console.log(`Cannot calculate Haversine for ${city.name}: missing coordinates`);
            await logCityError(supabase, jobId, city.id, city.name, 'missing_coordinates', 
              'Cannot calculate Haversine distance without coordinates', 0);
          }
        } else {
          // Real API errors (not ZERO_RESULTS/NOT_FOUND) should be logged
          await logCityError(supabase, jobId, city.id, city.name, 'matrix_api_error', 
            `Element status: ${element.status}`, 0); // No retry attempts for element errors
        }
      }
      
      return successCount;
    } else {
      throw new Error(`Matrix API returned status: ${matrixResult?.status || 'unknown'}`);
    }
  } catch (error) {
    console.error('Distance Matrix API call failed:', error);
    
    // Log error for all cities in batch with retry information
    const retryCount = (error as any).retryAttempts || 0;
    for (const city of cities) {
      await logCityError(supabase, jobId, city.id, city.name, 'matrix_api_error', getErrorMessage(error), retryCount);
    }
    return 0;
  }
}

// Haversine formula for calculating straight-line distance
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function calculateDistanceMatrix(
  destinations: string[],
  googleApiKey: string
): Promise<GoogleDistanceMatrixResponse | null> {
  const destinationsStr = destinations.join('|');
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(INDAIATUBA_COORDS)}&destinations=${encodeURIComponent(destinationsStr)}&units=metric&mode=driving&key=${googleApiKey}`;

  return await retryOperation(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MATRIX_TIMEOUT);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Distance Matrix timeout after ${MATRIX_TIMEOUT}ms`);
      }
      throw error;
    }
  }, `distance matrix for ${destinations.length} destinations`);
}

async function logCityError(
  supabase: any,
  jobId: string,
  cityId: string,
  cityName: string,
  reason: string,
  message: string,
  retryAttempts: number = 0
) {
  try {
    await supabase
      .from('site_city_distance_errors')
      .insert({
        job_id: jobId,
        city_id: cityId,
        reason,
        payload: {
          city_name: cityName,
          error_message: message,
          retry_attempts: retryAttempts,
          is_temporary_failure: retryAttempts > 0,
          timestamp: new Date().toISOString()
        }
      });

    // Increment failed count
    const { data: currentJob } = await supabase
      .from('site_city_distance_jobs')
      .select('failed_cities')
      .eq('id', jobId)
      .single();

    const currentFailedCount = currentJob?.failed_cities || 0;

    await supabase
      .from('site_city_distance_jobs')
      .update({
        failed_cities: currentFailedCount + 1
      })
      .eq('id', jobId);
  } catch (logError) {
    console.error('Failed to log city error:', logError);
  }
}

async function cancelDistanceCalculation(supabaseAdmin: any, userId: string) {
  const { data: job, error } = await supabaseAdmin
    .from('site_city_distance_jobs')
    .update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    })
    .eq('created_by', userId)
    .in('status', ['queued', 'running'])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cancelar job: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ message: 'Job cancelado com sucesso' }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getJobStatus(supabase: any, userId: string) {
  const { data: job, error } = await supabase
    .from('site_city_distance_jobs')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && (error as any).code !== 'PGRST116') {
    throw new Error(`Erro ao buscar status do job: ${getErrorMessage(error)}`);
  }

  return new Response(
    JSON.stringify({ job }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}