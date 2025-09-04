import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReviewStatus, ReviewPriority } from '@/types/review'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Build query based on user role
    let query = supabase
      .from('reviews')
      .select(`
        *,
        transcription:transcriptions(*),
        requester:user_profiles!requested_by(*),
        editor:user_profiles!assigned_to(*)
      `)
      .order('created_at', { ascending: false })

    // Filter based on role
    if (profile?.role === 'editor') {
      query = query.eq('assigned_to', user.id)
    } else if (profile?.role === 'transcriptionist') {
      query = query.eq('requested_by', user.id)
    }

    const { data: reviews, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      transcription_id, 
      notes, 
      priority = 0 
    }: {
      transcription_id: string
      notes?: string
      priority?: ReviewPriority
    } = body

    // Get the transcription to store original text
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('transcription_text')
      .eq('id', transcription_id)
      .single()

    if (transcriptionError) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Create review request
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        transcription_id,
        requested_by: user.id,
        status: 'pending' as ReviewStatus,
        priority,
        notes,
        original_text: transcription.transcription_text,
      })
      .select()
      .single()

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      )
    }

    // Update transcription with review status
    await supabase
      .from('transcriptions')
      .update({
        review_status: 'pending' as ReviewStatus,
        review_id: review.id,
      })
      .eq('id', transcription_id)

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      review_id,
      status,
      editor_notes,
      edited_text
    }: {
      review_id: string
      status?: ReviewStatus
      editor_notes?: string
      edited_text?: string
    } = body

    // Get user profile to check if they're an editor
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'editor') {
      return NextResponse.json(
        { error: 'Only editors can update reviews' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'in_review') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'completed' || status === 'approved' || status === 'rejected') {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (editor_notes) updateData.editor_notes = editor_notes
    if (edited_text) updateData.edited_text = edited_text

    // Update review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', review_id)
      .eq('assigned_to', user.id) // Ensure editor can only update their assigned reviews
      .select()
      .single()

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      )
    }

    // If review is completed/approved, update the transcription
    if (status === 'completed' || status === 'approved') {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('transcription_id, edited_text')
        .eq('id', review_id)
        .single()

      if (reviewData) {
        await supabase
          .from('transcriptions')
          .update({
            review_status: status,
            is_final: true,
            final_version: reviewData.edited_text || undefined,
          })
          .eq('id', reviewData.transcription_id)
      }
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
