'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { TherapistDocument } from '@/models/Therapist'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useCallback } from 'react'
import L from 'leaflet'

// Fix for default marker icon
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png'
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'

// Only run this on client side
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
    })
}

// Red marker for highlighted state
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Default blue marker
const defaultIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface ProviderMapProps {
    therapists: TherapistDocument[]
    onVisibleTherapistsChange?: (visibleIds: string[]) => void
    hoveredTherapistId?: string | null
}

interface GeocodedTherapist extends TherapistDocument {
    lat?: number
    lng?: number
}

function MapEventHandler({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
    const map = useMapEvents({
        moveend: () => {
            onBoundsChange(map.getBounds())
        },
        zoomend: () => {
            onBoundsChange(map.getBounds())
        }
    })

    // Trigger initial bounds check when map is ready
    useEffect(() => {
        onBoundsChange(map.getBounds())
    }, [map, onBoundsChange])

    return null
}

export default function ProviderMap({ therapists, onVisibleTherapistsChange, hoveredTherapistId }: ProviderMapProps) {
    const [geocodedTherapists, setGeocodedTherapists] = useState<GeocodedTherapist[]>([])
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)

    useEffect(() => {
        const geocodeTherapists = async () => {
            // We'll use a simple cache to avoid re-fetching if we already have coordinates
            // In a real app, this should be stored in the DB
            const updatedTherapists = await Promise.all(
                therapists.map(async (therapist) => {
                    // If we already have coordinates (future proofing), use them
                    // For now, we assume we don't have them in the DB

                    if (!therapist.address || !therapist.city) return therapist

                    const query = `${therapist.address}, ${therapist.zip || ''} ${therapist.city}`.trim()

                    try {
                        // Add a small delay to respect rate limits if we have many requests
                        // This is a naive implementation
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
                    return mapBounds.contains([t.lat, t.lng])
                }
                return false
            })
            .map(t => t._id)

        // Only trigger if we have geocoded therapists, otherwise we might filter everyone out prematurely
        if (geocodedTherapists.some(t => t.lat && t.lng)) {
            onVisibleTherapistsChange(visibleIds)
        }
    }, [mapBounds, geocodedTherapists, onVisibleTherapistsChange])

    // Default center (Switzerland)
    const center: [number, number] = [46.8182, 8.2275]
    const zoom = 8

    return (
        <div className="h-full w-full rounded-lg overflow-hidden shadow-md border border-gray-200 z-0 relative">
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEventHandler onBoundsChange={setMapBounds} />
                {geocodedTherapists.map((therapist) => (
                    therapist.lat && therapist.lng && (
                        <Marker
                            key={therapist._id}
                            position={[therapist.lat, therapist.lng]}
                            icon={therapist._id === hoveredTherapistId ? redIcon : defaultIcon}
                            zIndexOffset={therapist._id === hoveredTherapistId ? 1000 : 0}
                        >
                            <Popup>
                                <div className="font-semibold">{therapist.name}</div>
                                <div className="text-sm">
                                    {typeof therapist.specialization === 'string'
                                        ? therapist.specialization
                                        : (therapist.specialization as any)?.en || 'Specialization'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 mb-2">
                                    {therapist.address}, {therapist.zip} {therapist.city}
                                </div>
                                <a
                                    href={`/book/${therapist._id}`}
                                    className="block w-full text-center bg-blue-600 !text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors font-medium no-underline"
                                    style={{ color: 'white' }}
                                >
                                    Book Appointment
                                </a>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    )
}
