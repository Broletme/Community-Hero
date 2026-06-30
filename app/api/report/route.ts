import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import type { Report, SubmitReportResult, Category, Severity } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const latStr = formData.get('lat') as string | null
    const lngStr = formData.get('lng') as string | null

    if (!imageFile || !latStr || !lngStr) {
      return NextResponse.json({ error: 'Missing image, lat, or lng' }, { status: 400 })
    }

    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // 1. Upload image to Supabase Storage
    const ext = imageFile.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const arrayBuffer = await imageFile.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(fileName, arrayBuffer, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('[report] Upload error:', uploadError)
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('report-images')
      .getPublicUrl(uploadData.path)
    const imageUrl = urlData.publicUrl

    // 2. Categorize via Groq (send as base64 data URL)
    let category: Category = 'other'
    let severity: Severity = 'medium'
    let description = 'Infrastructure issue reported.'
    let fallback = false

    try {
      // Convert to base64 data URL for vision API
      const bytes = new Uint8Array(arrayBuffer)
      const base64 = Buffer.from(bytes).toString('base64')
      const dataUrl = `data:${imageFile.type || 'image/jpeg'};base64,${base64}`

      const categorizeRes = await fetch(new URL('/api/categorize', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      })

      if (categorizeRes.ok) {
        const cat = await categorizeRes.json()
        category = cat.category ?? 'other'
        severity = cat.severity ?? 'medium'
        description = cat.description ?? 'Infrastructure issue reported.'
        fallback = cat.fallback ?? false
      }
    } catch (catErr) {
      console.error('[report] Categorization failed (non-blocking):', catErr)
      fallback = true
    }

    // 3. Check for nearby duplicate report
    const { data: nearbyData, error: nearbyError } = await supabase.rpc('find_nearby_report', {
      p_lat: lat,
      p_lng: lng,
      p_category: category,
      radius_m: 60,
      days_window: 30,
    })

    if (nearbyError) {
      console.error('[report] RPC error:', nearbyError)
    }

    const nearby = nearbyData && nearbyData.length > 0 ? nearbyData[0] : null
    let clusterId: string | null = null
    let merged = false
    let clusterRootId: string | null = null

    if (nearby) {
      // Use the cluster root's id (coalesced in the RPC)
      clusterId = nearby.cluster_id ?? nearby.id
      clusterRootId = clusterId
      merged = true

      // Increment verification_count on the cluster root
      await supabase
        .from('reports')
        .update({ verification_count: supabase.rpc('verification_count', {}) })
        .eq('id', clusterRootId)

      // Simpler approach: fetch current count and increment
      const { data: rootReport } = await supabase
        .from('reports')
        .select('verification_count')
        .eq('id', clusterRootId)
        .single()

      if (rootReport) {
        await supabase
          .from('reports')
          .update({ verification_count: (rootReport.verification_count ?? 0) + 1 })
          .eq('id', clusterRootId)
      }
    }

    // 4. Insert new report
    const newReportData = {
      image_url: imageUrl,
      category,
      severity,
      description,
      lat,
      lng,
      status: 'reported' as const,
      cluster_id: clusterId,
      verification_count: merged ? 1 : 0,
    }

    const { data: insertedReport, error: insertError } = await supabase
      .from('reports')
      .insert(newReportData)
      .select()
      .single()

    if (insertError) {
      console.error('[report] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    // 5. Get final cluster count for the response message
    let clusterCount = 1
    if (merged && clusterRootId) {
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('cluster_id', clusterRootId)

      // count includes the root + all duplicates except the root itself (cluster_id = root.id)
      // root itself has cluster_id = null, so add 1
      clusterCount = (count ?? 0) + 1
    }

    const result: SubmitReportResult & { fallback?: boolean } = {
      report: insertedReport as Report,
      merged,
      clusterCount,
      fallback,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[report] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
