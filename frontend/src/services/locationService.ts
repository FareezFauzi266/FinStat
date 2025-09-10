export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  error?: string;
}

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current location using GPS
   */
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: 0,
          longitude: 0,
          error: 'Geolocation is not supported by this browser.'
        });
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const address = await this.reverseGeocode(latitude, longitude);
            resolve({
              latitude,
              longitude,
              address
            });
          } catch (error) {
            resolve({
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          resolve({
            latitude: 0,
            longitude: 0,
            error: errorMessage
          });
        },
        options
      );
    });
  }

  /**
   * Start watching location changes
   */
  startWatchingLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: string) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const address = await this.reverseGeocode(latitude, longitude);
          onLocationUpdate({
            latitude,
            longitude,
            address
          });
        } catch (error) {
          onLocationUpdate({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        onError?.(errorMessage);
      },
      options
    );
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FinStat/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const address = data.display_name;
      return address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /**
   * Generate Google Maps link for coordinates
   */
  generateMapsLink(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  /**
   * Check if geolocation is supported and permission is granted
   */
  async checkLocationPermission(): Promise<{ supported: boolean; granted: boolean; error?: string }> {
    if (!navigator.geolocation) {
      return { supported: false, granted: false, error: 'Geolocation is not supported by this browser.' };
    }

    try {
      // Check if we can get the current position
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error) => reject(error),
          { timeout: 1000, maximumAge: 0 }
        );
      });
      
      return { supported: true, granted: true };
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        return { supported: true, granted: false, error: 'Location permission denied.' };
      }
      return { supported: true, granted: false, error: 'Location access unavailable.' };
    }
  }
}

export const locationService = LocationService.getInstance();
