import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reviewId = searchParams.get('review_id')

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      )
    }

    // Check if user has access to this review
    const { data: review } = await supabase
      .from('reviews')
      .select('requested_by, assigned_to')
      .eq('id', reviewId)
      .single()

    if (!review || (review.requested_by !== user.id && review.assigned_to !== user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('review_comments')
      .select(`
        *,
        user:user_profiles!user_id(*)
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
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
      review_id,
      comment,
      timestamp_reference
    }: {
      review_id: string
      comment: string
      timestamp_reference?: number
    } = body

    // Check if user has access to this review
    const { data: review } = await supabase
      .from('reviews')
      .select('requested_by, assigned_to')
      .eq('id', review_id)
      .single()

    if (!review || (review.requested_by !== user.id && review.assigned_to !== user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create comment
    const { data: newComment, error } = await supabase
      .from('review_comments')
      .insert({
        review_id,
        user_id: user.id,
        comment,
        timestamp_reference
      })
      .select(`
        *,
        user:user_profiles!user_id(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: newComment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
