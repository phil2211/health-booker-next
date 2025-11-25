'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { TherapistDocument } from '@/models/Therapist'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
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

interface ProviderMapProps {
    therapists: TherapistDocument[]
}

interface GeocodedTherapist extends TherapistDocument {
    lat?: number
    lng?: number
}

export default function ProviderMap({ therapists }: ProviderMapProps) {
    const [geocodedTherapists, setGeocodedTherapists] = useState<GeocodedTherapist[]>([])

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
                {geocodedTherapists.map((therapist) => (
                    therapist.lat && therapist.lng && (
                        <Marker key={therapist._id} position={[therapist.lat, therapist.lng]}>
                            <Popup>
                                <div className="font-semibold">{therapist.name}</div>
                                <div className="text-sm">
                                    {typeof therapist.specialization === 'string'
                                        ? therapist.specialization
                                        : (therapist.specialization as any)?.en || 'Specialization'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {therapist.address}, {therapist.zip} {therapist.city}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    )
}
