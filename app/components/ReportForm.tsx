'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { APIProvider, Map, AdvancedMarker, type MapMouseEvent } from '@vis.gl/react-google-maps'
import { Upload, MapPin, Crosshair, Camera, X, Loader } from 'lucide-react'
import type { SubmitReportResult } from '@/lib/types'
import SubmitResult from './SubmitResult'

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 } // New Delhi

type FormStep = 'upload' | 'location' | 'submitting' | 'done'

export default function ReportForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<FormStep>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<(SubmitReportResult & { fallback?: boolean }) | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Auto-request geolocation when moving to location step
  useEffect(() => {
    if (step === 'location' && !coords) {
      requestGeolocation()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported. Drop a pin on the map.')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(loc)
        setMapCenter(loc)
        setGeoLoading(false)
      },
      (err) => {
        setGeoLoading(false)
        setGeoError(`Could not get your location (${err.message}). Drop a pin on the map.`)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setStep('location')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (e.detail?.latLng) {
      setCoords({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng })
    }
  }, [])

  const handleSubmit = async () => {
    if (!imageFile || !coords) return
    setStep('submitting')
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('lat', coords.lat.toString())
      formData.append('lng', coords.lng.toString())

      const res = await fetch('/api/report', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Submission failed')
      }

      const result = await res.json()
      setSubmitResult(result)
      setStep('done')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
      setStep('location')
    }
  }

  const resetForm = () => {
    setStep('upload')
    setImageFile(null)
    setImagePreview(null)
    setCoords(null)
    setSubmitResult(null)
    setSubmitError(null)
    setGeoError(null)
  }

  // ── Step: DONE ────────────────────────────────────────────────────────────────
  if (step === 'done' && submitResult) {
    return (
      <SubmitResult
        result={submitResult}
        onDone={() => router.push('/')}
        onReportAnother={resetForm}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '0.25rem' }}>
        {(['upload', 'location'] as const).map((s, i) => {
          const active = step === s || (step === 'submitting' && s === 'location')
          const done = s === 'upload' && (step === 'location' || step === 'submitting')
          return (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div
                style={{
                  height: 3,
                  background: done || active ? 'var(--color-orange)' : 'var(--color-asphalt-mid)',
                  transition: 'background 0.3s',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--color-orange)' : done ? 'var(--color-paper-dim)' : 'var(--color-paper-dark)',
                }}
              >
                {i + 1}. {s === 'upload' ? 'Photo' : 'Location'}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Photo upload ────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div>
          <label className="field-label">Upload Photo</label>
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload photo of issue"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            id="photo-upload-zone"
          >
            <Upload
              size={32}
              style={{ color: 'var(--color-paper-dark)', marginBottom: '0.75rem' }}
            />
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-paper)',
                marginBottom: '0.25rem',
              }}
            >
              Drop photo here or click to browse
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-paper-dark)',
              }}
            >
              JPG, PNG, HEIC — mobile camera supported
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            id="photo-file-input"
          />

          {/* Camera button for mobile */}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              id="camera-btn"
            >
              <Camera size={14} /> Take Photo
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Location ───────────────────────────────────────────────── */}
      {(step === 'location' || step === 'submitting') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Image preview */}
          {imagePreview && (
            <div style={{ position: 'relative' }}>
              <label className="field-label">Photo</label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  display: 'block',
                  border: '1px solid var(--color-asphalt-mid)',
                }}
              />
              <button
                onClick={resetForm}
                style={{
                  position: 'absolute',
                  top: '1.75rem',
                  right: '0.5rem',
                  background: 'rgba(28,27,25,0.85)',
                  border: 'none',
                  color: 'var(--color-paper)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Remove photo"
                id="remove-photo-btn"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Geolocation */}
          <div>
            <label className="field-label">Location</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {coords ? (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--color-sev-low)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <MapPin size={14} /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-paper-dark)',
                  }}
                >
                  {geoLoading ? 'Detecting location…' : 'No location set — click map to drop pin'}
                </span>
              )}
              <button
                className="btn-ghost"
                onClick={requestGeolocation}
                disabled={geoLoading}
                id="use-my-location-btn"
              >
                {geoLoading ? <span className="spinner" /> : <Crosshair size={14} />}
                {geoLoading ? 'Locating…' : 'Use My Location'}
              </button>
            </div>

            {geoError && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-sev-medium)',
                  marginBottom: '0.5rem',
                }}
              >
                ⚠ {geoError}
              </p>
            )}

            {/* Map picker */}
            <APIProvider apiKey={MAPS_API_KEY}>
              <div
                style={{
                  height: 240,
                  border: '1px solid var(--color-asphalt-mid)',
                  overflow: 'hidden',
                }}
              >
                <Map
                  defaultCenter={mapCenter}
                  center={mapCenter}
                  defaultZoom={14}
                  mapId="report-picker"
                  disableDefaultUI={false}
                  gestureHandling="greedy"
                  onClick={handleMapClick}
                  colorScheme="DARK"
                  style={{ width: '100%', height: '100%' }}
                  onCameraChanged={(ev) => setMapCenter(ev.detail.center)}
                >
                  {coords && (
                    <AdvancedMarker position={coords} title="Issue location">
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          background: 'var(--color-orange)',
                          borderRadius: '50% 50% 50% 0',
                          transform: 'rotate(-45deg)',
                          border: '2px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                      />
                    </AdvancedMarker>
                  )}
                </Map>
              </div>
            </APIProvider>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                color: 'var(--color-paper-dark)',
                marginTop: '0.375rem',
              }}
            >
              Click anywhere on the map to place the pin at the exact issue location.
            </p>
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              style={{
                border: '1px solid var(--color-sev-high)',
                padding: '0.625rem 0.875rem',
                color: 'var(--color-sev-high)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              }}
            >
              ✕ {submitError}
            </div>
          )}

          {/* Submit button */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!coords || step === 'submitting'}
              id="submit-report-btn"
            >
              {step === 'submitting' ? (
                <>
                  <span className="spinner" /> Submitting…
                </>
              ) : (
                <>
                  <MapPin size={14} /> Submit Report
                </>
              )}
            </button>
            <button
              className="btn-secondary"
              onClick={resetForm}
              disabled={step === 'submitting'}
              id="back-btn"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
