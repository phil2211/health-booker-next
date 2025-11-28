'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { TherapistDocument } from '@/models/Therapist'
import Link from 'next/link'

interface ProviderMapProps {
    therapists: TherapistDocument[]
    onVisibleTherapistsChange?: (visibleIds: string[]) => void
    hoveredTherapistId?: string | null
}

interface GeocodedTherapist extends TherapistDocument {
    lat?: number
    lng?: number
}

// Component to handle map events like bounds changing
function MapEventHandler({ onBoundsChange }: { onBoundsChange: (bounds: google.maps.LatLngBounds) => void }) {
    const map = useMap()

    useEffect(() => {
        if (!map) return

        const listener = map.addListener('idle', () => {
            const bounds = map.getBounds()
            if (bounds) {
                onBoundsChange(bounds)
            }
        })

        return () => {
            google.maps.event.removeListener(listener)
        }
    }, [map, onBoundsChange])

    return null
}

function UserLocationUpdater() {
    const map = useMap()
    const [hasLocated, setHasLocated] = useState(false)

    useEffect(() => {
        if (!map || hasLocated) return

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    map.setCenter({ lat: latitude, lng: longitude })
                    map.setZoom(11) // Zoom 11 is approximately 20km view width
                    setHasLocated(true)
                },
                (error) => {
                    console.log('Geolocation failed or denied:', error)
                }
            )
        }
    }, [map, hasLocated])

    return null
}

export default function ProviderMap({ therapists, onVisibleTherapistsChange, hoveredTherapistId }: ProviderMapProps) {
    const [geocodedTherapists, setGeocodedTherapists] = useState<GeocodedTherapist[]>([])
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)
    const [selectedTherapist, setSelectedTherapist] = useState<GeocodedTherapist | null>(null)

    // Geocoding logic (keeping existing Nominatim for now to ensure data availability without extra API setup)
    useEffect(() => {
        const geocodeTherapists = async () => {
            const updatedTherapists = await Promise.all(
                therapists.map(async (therapist) => {
                    if (!therapist.address || !therapist.city) return therapist

                    const query = `${therapist.address}, ${therapist.zip || ''} ${therapist.city}`.trim()

                    try {
                        // Add a small delay to respect rate limits
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))

                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                        if (!response.ok) return therapist

                        const data = await response.json()
                        if (data && data.length > 0) {
                            return {
                                ...therapist,
                                lat: parseFloat(data[0].lat),
                                lng: parseFloat(data[0].lon)
                            }
                        }
                    } catch (error) {
                        console.error('Geocoding error for', query, error)
                    }
                    return therapist
                })
            )
            setGeocodedTherapists(updatedTherapists)
        }

        if (therapists.length > 0) {
            geocodeTherapists()
        }
    }, [therapists])

    // Filter therapists when bounds or geocoded therapists change
    useEffect(() => {
        if (!mapBounds || !onVisibleTherapistsChange) return

        const visibleIds = geocodedTherapists
            .filter(t => {
                if (t.lat && t.lng) {
                    return mapBounds.contains({ lat: t.lat, lng: t.lng })
                }
                return false
            })
            .map(t => t._id)

        if (geocodedTherapists.some(t => t.lat && t.lng)) {
            onVisibleTherapistsChange(visibleIds)
        }
    }, [mapBounds, geocodedTherapists, onVisibleTherapistsChange])

    // Default center (Switzerland)
    const defaultCenter = { lat: 46.8182, lng: 8.2275 }
    const defaultZoom = 8

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
        return <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Google Maps API Key missing</div>
    }

    return (
        <div className="h-full w-full rounded-lg overflow-hidden shadow-md border border-gray-200 z-0 relative">
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={defaultZoom}
                    mapId="DEMO_MAP_ID" // Required for AdvancedMarker
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                >
                    <MapEventHandler onBoundsChange={setMapBounds} />
                    <UserLocationUpdater />

                    {geocodedTherapists.map((therapist) => (
                        therapist.lat && therapist.lng && (
                            <AdvancedMarker
                                key={therapist._id}
                                position={{ lat: therapist.lat, lng: therapist.lng }}
                                onClick={() => setSelectedTherapist(therapist)}
                                zIndex={therapist._id === hoveredTherapistId ? 1000 : 0}
                            >
                                <Pin
                                    background={therapist._id === hoveredTherapistId ? '#EF4444' : '#3B82F6'}
                                    borderColor={therapist._id === hoveredTherapistId ? '#B91C1C' : '#1D4ED8'}
                                    glyphColor={'#FFFFFF'}
                                />
                            </AdvancedMarker>
                        )
                    ))}

                    {selectedTherapist && selectedTherapist.lat && selectedTherapist.lng && (
                        <InfoWindow
                            position={{ lat: selectedTherapist.lat, lng: selectedTherapist.lng }}
                            onCloseClick={() => setSelectedTherapist(null)}
                        >
                            <div className="min-w-[200px] p-2">
                                <div className="font-semibold text-gray-900 mb-1">{selectedTherapist.name}</div>
                                <div className="text-sm text-blue-600 font-medium mb-1">
                                    {typeof selectedTherapist.specialization === 'string'
                                        ? selectedTherapist.specialization
                                        : (selectedTherapist.specialization as any)?.en || 'Specialization'}
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                    {selectedTherapist.address}, {selectedTherapist.zip} {selectedTherapist.city}
                                </div>
                                <Link
                                    href={`/book/${selectedTherapist._id}`}
                                    className="block w-full text-center bg-indigo-600 text-white px-3 py-2 rounded text-xs hover:bg-indigo-700 transition-colors font-medium no-underline"
                                >
                                    Book Appointment
                                </Link>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>
        </div>
    )
}
