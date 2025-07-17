import requests
import math
from typing import Dict, List, Optional

def geocode_address(address: str) -> Optional[Dict]:
    """
    Convert address to latitude/longitude using OpenStreetMap Nominatim
    """
    if not address:
        return None
        
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': address,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'tz,ke'  # Limit to Tanzania since you're in Dar es Salaam
    }
    headers = {
        'User-Agent': 'PatientDashboard/1.0'  # Required by Nominatim
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data:
            return {
                'lat': float(data[0]['lat']),
                'lon': float(data[0]['lon']),
                'display_name': data[0].get('display_name', address)
            }
    except requests.RequestException as e:
        print(f"Geocoding error: {e}")
    except (IndexError, KeyError, ValueError) as e:
        print(f"Geocoding data error: {e}")
    
    return None

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth (in kilometers)
    """
    R = 6371  # Radius of Earth in kilometers
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def find_nearby_hospitals(lat: float, lon: float, radius_km: int = 10) -> List[Dict]:
    """
    Find nearby hospitals using OpenStreetMap Overpass API
    """
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    # Overpass QL query to find hospitals within radius
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:{radius_km * 1000},{lat},{lon});
      way["amenity"="hospital"](around:{radius_km * 1000},{lat},{lon});
      relation["amenity"="hospital"](around:{radius_km * 1000},{lat},{lon});
    );
    out center meta;
    """
    
    try:
        response = requests.post(overpass_url, data=query, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        hospitals = []
        for element in data.get('elements', []):
            # Get coordinates
            if element['type'] == 'node':
                hosp_lat = element['lat']
                hosp_lon = element['lon']
            elif 'center' in element:
                hosp_lat = element['center']['lat']
                hosp_lon = element['center']['lon']
            else:
                continue
            
            # Extract hospital information
            tags = element.get('tags', {})
            name = tags.get('name', 'Unknown Hospital')
            
            # Skip if no proper name
            if name == 'Unknown Hospital' and not tags.get('operator'):
                continue
            
            # Calculate distance
            distance = haversine_distance(lat, lon, hosp_lat, hosp_lon)
            
            hospital_info = {
                'name': name,
                'distance_km': round(distance, 2),
                'distance_text': f"{distance:.1f} km",
                'address': tags.get('addr:full') or tags.get('addr:street', 'Address not available'),
                'phone': tags.get('phone', tags.get('contact:phone', 'Not available')),
                'website': tags.get('website', tags.get('contact:website', '')),
                'operator': tags.get('operator', ''),
                'emergency': tags.get('emergency', 'unknown'),
                'coordinates': {
                    'lat': hosp_lat,
                    'lon': hosp_lon
                }
            }
            
            hospitals.append(hospital_info)
        
        # Sort by distance and return top 10
        hospitals.sort(key=lambda x: x['distance_km'])
        return hospitals[:10]
        
    except requests.RequestException as e:
        print(f"Hospital search error: {e}")
        return []
    except Exception as e:
        print(f"Hospital data processing error: {e}")
        return []

def get_consultation_groups() -> Dict:
    """
    Return consultation group links - Easy to modify for frontend
    """
    return {
        'whatsapp': {
            'name': 'Medical Consultation Group',
            'link': 'https://chat.whatsapp.com/Lq7OV6PBT8p43y0dkoQUr6',
            'description': 'Get instant medical consultation from our doctors',
            'icon': 'whatsapp',
            'color': '#25D366',
            'available': True
        },
        'telegram': {
            'name': 'Health Support Channel',
            'link': 'https://t.me/+WovcsURvAd5iMWRk',
            'description': 'Join our health support community',
            'icon': 'telegram',
            'color': '#0088cc',
            'available': True
        }
    }