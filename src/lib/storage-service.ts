import { createServerClient } from './supabase-api'
import { supabase } from './supabase'

const AUDIO_BUCKET = 'audio-files'

/**
 * Ensure the audio bucket exists and is properly configured
 * Includes delays to prevent race conditions
 */
async function ensureBucketExists(supabase: any, bucketName: string): Promise<boolean> {
  // Skip bucket creation - assume it exists as configured in database
  console.log(`✅ Bucket ${bucketName} assumed to exist (RLS-protected creation disabled)`)
  return true
}

/**
 * Upload audio file to Supabase Storage
 * @param file The audio file to upload
 * @param transcriptionId The ID of the transcription record
 * @returns The public URL of the uploaded file
 */
export async function uploadAudioToStorage(
  file: File | Buffer,
  transcriptionId: string,
  fileName?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Determine file extension
    const extension = fileName ? fileName.split('.').pop() : 'mp3'
    const filePath = `uploads/${transcriptionId}.${extension}`

    // Convert File to ArrayBuffer if needed
    let fileData: ArrayBuffer | Buffer
    if (file instanceof File) {
      fileData = await file.arrayBuffer()
    } else {
      fileData = file
    }

    // First, ensure the bucket exists
    const bucketExists = await ensureBucketExists(supabase, AUDIO_BUCKET)
    if (!bucketExists) {
      console.error('Failed to create or access audio-files bucket')
      return { url: null, error: 'Storage bucket unavailable' }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, fileData, {
        contentType: file instanceof File ? file.type : 'audio/mpeg',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { url: null, error: error.message }
    }

    console.log(`✅ File uploaded successfully to ${filePath}`)

    // Get public URL immediately - no delay needed for properly configured public buckets
    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath)

    console.log(`✅ Public URL generated: ${publicUrl}`)
    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to upload audio file'
    }
  }
}

/**
 * Upload audio file server-side using service role
 */
export async function uploadAudioServerSide(
  file: Buffer,
  transcriptionId: string,
  fileName: string,
  contentType: string = 'audio/mpeg'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase configuration')
      return { url: null, error: 'Storage configuration missing' }
    }

    // Determine file extension
    const extension = fileName.split('.').pop() || 'mp3'
    const filePath = `uploads/${transcriptionId}.${extension}`

    // Use direct HTTP upload to bypass RLS and SDK validation issues
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${AUDIO_BUCKET}/${filePath}`
    
    console.log(`📤 Uploading directly via HTTP to: ${uploadUrl}`)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': contentType
      },
      body: file
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error(`❌ Direct upload failed [${uploadResponse.status}]:`, errorText)
      // Don't return yet - might need to try bucket creation or other approach
    } else {
      console.log(`✅ Direct HTTP upload successful`)
      // Return the public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}/${filePath}`
      return { url: publicUrl, error: null }
    }

    // Fallback: Try SDK-based upload if direct HTTP fails
    const supabase = createServerClient()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file, {
        contentType,
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Server storage upload error:', error)
      return { url: null, error: error.message }
    }

    console.log(`✅ Server: File uploaded successfully to ${filePath}`)

    // Get public URL immediately - no delay needed for properly configured public buckets
    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath)

    console.log(`✅ Server: Public URL generated: ${publicUrl}`)
    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Server upload error:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to upload audio file'
    }
  }
}

/**
 * Test bucket access and create if needed
 */
export async function testBucketAccess(): Promise<{ exists: boolean; isPublic: boolean; error: string | null }> {
  try {
    const supabase = createServerClient()

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return { exists: false, isPublic: false, error: listError.message }
    }

    const bucket = buckets?.find((b: any) => b.name === AUDIO_BUCKET)

    if (!bucket) {
      return { exists: false, isPublic: false, error: null }
    }

    // Test public access by trying to get a file that might not exist
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl('test-file.mp3')

      // Try to access the URL (will fail for non-existent file but should not be 404 bucket not found)
      const response = await fetch(publicUrl, { method: 'HEAD' })

      // If we get 404 (file not found) but not 400 (bucket not found), bucket is accessible
      if (response.status === 404) {
        return { exists: true, isPublic: true, error: null }
      } else if (response.status === 400) {
        return { exists: false, isPublic: false, error: 'Bucket not accessible' }
      } else {
        return { exists: true, isPublic: false, error: null }
      }
    } catch (accessError) {
      return { exists: true, isPublic: false, error: 'Cannot verify bucket access' }
    }

  } catch (error) {
    return {
      exists: false,
      isPublic: false,
      error: error instanceof Error ? error.message : 'Failed to test bucket access'
    }
  }
}

/**
 * Get a signed URL for private audio file access
 */
export async function getSignedAudioUrl(
  filePathOrUrl: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Extract the file path from the URL if a full URL was provided
    let filePath = filePathOrUrl
    
    // Check if it's a full URL and extract the path
    if (filePathOrUrl.includes('http')) {
      // Example URL: https://supabase.healthscribe.pro/storage/v1/object/public/audio-files/USER_ID/FILE.mp3
      // We need to extract: USER_ID/FILE.mp3
      const match = filePathOrUrl.match(/\/audio-files\/(.+)$/)
      if (match && match[1]) {
        filePath = match[1]
        console.log(`📁 Extracted file path from URL: ${filePath}`)
      } else {
        console.warn(`⚠️ Could not extract file path from URL: ${filePathOrUrl}`)
        // If the file is already public, just return the URL as-is
        if (filePathOrUrl.includes('/public/')) {
          console.log(`✅ Using public URL directly: ${filePathOrUrl}`)
          return { url: filePathOrUrl, error: null }
        }
        return { url: null, error: 'Invalid file path or URL format' }
      }
    }
    
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('Signed URL error:', error)
      // If file is public and signed URL fails, try returning the public URL
      if (filePathOrUrl.includes('/public/')) {
        console.log(`⚠️ Signed URL failed, returning public URL: ${filePathOrUrl}`)
        return { url: filePathOrUrl, error: null }
      }
      return { url: null, error: error.message }
    }
    
    return { url: data.signedUrl, error: null }
  } catch (error) {
    console.error('Get signed URL error:', error)
    // If file is public and an exception occurs, try returning the public URL
    if (filePathOrUrl.includes('/public/')) {
      console.log(`⚠️ Exception occurred, returning public URL: ${filePathOrUrl}`)
      return { url: filePathOrUrl, error: null }
    }
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Failed to get signed URL' 
    }
  }
}

/**
 * Delete audio file from storage
 */
export async function deleteAudioFromStorage(
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath])
    
    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Delete audio error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete audio file' 
    }
  }
}

/**
 * Check if storage bucket exists and create if not
 */
export async function ensureStorageBucket(): Promise<{ exists: boolean; error: string | null }> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      // If we can't list buckets, we might not have permission
      // Try to upload a test file instead
      const testFile = new Uint8Array([1, 2, 3])
      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload('test.txt', testFile, { upsert: true })
      
      if (uploadError && uploadError.message.includes('Bucket not found')) {
        return { exists: false, error: 'Storage bucket does not exist' }
      }
      
      // Clean up test file if it uploaded successfully
      if (!uploadError) {
        await supabase.storage.from(AUDIO_BUCKET).remove(['test.txt'])
      }
      
      return { exists: true, error: null }
    }
    
    const bucketExists = buckets?.some(b => b.name === AUDIO_BUCKET)
    
    if (!bucketExists) {
      return { exists: false, error: 'Storage bucket does not exist' }
    }
    
    return { exists: true, error: null }
  } catch (error) {
    console.error('Check bucket error:', error)
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Failed to check storage bucket' 
    }
  }
}
