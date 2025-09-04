import { createServerClient } from './supabase-api'
import { supabase } from './supabase'

const AUDIO_BUCKET = 'audio-files'

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
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath)
    
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
    const supabase = createServerClient()
    
    // Determine file extension
    const extension = fileName.split('.').pop() || 'mp3'
    const filePath = `uploads/${transcriptionId}.${extension}`
    
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
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath)
    
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
 * Get a signed URL for private audio file access
 */
export async function getSignedAudioUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('Signed URL error:', error)
      return { url: null, error: error.message }
    }
    
    return { url: data.signedUrl, error: null }
  } catch (error) {
    console.error('Get signed URL error:', error)
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
