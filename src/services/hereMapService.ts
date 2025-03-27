import  axios from 'axios';

const API_ID = 'XTtoCRoGlnJPG8MRxXUw';
const API_KEY = '7xjxhKBSxBrNweiYLqV_tcl_1lJUnFVbGMOkH_nXKBM';

export interface Coordinates {
  lat: number;
  lng: number;
}

// Function to get a static map image via proxy
export const getStaticMapImage = async (
  center: Coordinates,
  zoom: number = 14,
  width: number = 600,
  height: number = 400,
  mapType: string = 'normal.day'
): Promise<string> => {
  try {
    const url = `https://image.maps.ls.hereapi.com/mia/1.6/mapview`;
    
    const params = {
      apiKey: API_KEY,
      c: `${center.lat},${center.lng}`,
      z: zoom,
      w: width,
      h: height,
      t: mapType,
      ppi: 320,
    };
    
    // Use our proxy server
    const response = await axios.get('https://hooks.jdoodle.net/proxy', {
      params: {
        url: `${url}?${new URLSearchParams(params as any).toString()}`
      }
    });
    
    return response.data.imageUrl || '';
  } catch (error) {
    console.error('Error fetching map image:', error);
    return '';
  }
};

// Function to calculate a route
export const calculateRoute = async (
  origin: Coordinates,
  destination: Coordinates,
  waypoints: Coordinates[] = []
): Promise<any> => {
  try {
    const url = `https://router.hereapi.com/v8/routes`;
    
    const waypointsParam = [
      `${origin.lat},${origin.lng}`,
      ...waypoints.map(wp => `${wp.lat},${wp.lng}`),
      `${destination.lat},${destination.lng}`
    ].join(';');
    
    const params = {
      apiKey: API_KEY,
      transportMode: 'car',
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      return: 'polyline,summary,actions,instructions'
    };
    
    // Use our proxy server
    const response = await axios.get('https://hooks.jdoodle.net/proxy', {
      params: {
        url: `${url}?${new URLSearchParams(params as any).toString()}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
};

// Function to get real-time traffic
export const getTrafficInfo = async (
  bbox: string,
  zoom: number = 10
): Promise<any> => {
  try {
    const url = `https://traffic.ls.hereapi.com/traffic/6.2/incidents.json`;
    
    const params = {
      apiKey: API_KEY,
      bbox: bbox,
      criticality: 'critical,major,minor',
    };
    
    // Use our proxy server
    const response = await axios.get('https://hooks.jdoodle.net/proxy', {
      params: {
        url: `${url}?${new URLSearchParams(params as any).toString()}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching traffic info:', error);
    return null;
  }
};

// Function to geocode an address
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode`;
    
    const params = {
      apiKey: API_KEY,
      q: address,
      limit: 1
    };
    
    // Use our proxy server
    const response = await axios.get('https://hooks.jdoodle.net/proxy', {
      params: {
        url: `${url}?${new URLSearchParams(params as any).toString()}`
      }
    });
    
    if (response.data?.items?.length > 0) {
      const position = response.data.items[0].position;
      return {
        lat: position.lat,
        lng: position.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Function to reverse geocode coordinates
export const reverseGeocode = async (coordinates: Coordinates): Promise<string | null> => {
  try {
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode`;
    
    const params = {
      apiKey: API_KEY,
      at: `${coordinates.lat},${coordinates.lng}`,
      lang: 'en-US'
    };
    
    // Use our proxy server
    const response = await axios.get('https://hooks.jdoodle.net/proxy', {
      params: {
        url: `${url}?${new URLSearchParams(params as any).toString()}`
      }
    });
    
    if (response.data?.items?.length > 0) {
      return response.data.items[0].address.label;
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};
 