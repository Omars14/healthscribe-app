import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export interface DirectUploadOptions {
  file: File
  userId?: string
  bucketName?: string
}

export interface DirectUploadResult {
  publicUrl: string
  path: string
  error?: string
}

/**
 * Upload file directly to Supabase Storage from the client
 * This bypasses Vercel's 4.5MB limit
 */
export async function uploadDirectToStorage({
  file,
  userId,
  bucketName = 'audio-files'
}: DirectUploadOptions): Promise<DirectUploadResult> {
  try {
    // Generate unique file name
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'mp3'
    const fileName = `${timestamp}-${uuidv4()}.${fileExt}`
    const filePath = userId ? `${userId}/${fileName}` : `anonymous/${fileName}`
    
    console.log('📤 Uploading directly to Supabase Storage:', filePath)
    
    // Upload directly to Supabase Storage from client with optimized settings
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        // Add progress tracking if supported
        onUploadProgress: (progress) => {
          console.log(`📤 Upload progress: ${Math.round(progress.loaded / progress.total * 100)}%`)
        }
      })
    
    if (error) {
      console.error('❌ Storage upload error:', error)
      
      // Try to create bucket if it doesn't exist
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        console.log('🪣 Bucket might not exist, please create it in Supabase dashboard')
        throw new Error('Storage bucket not configured. Please contact support.')
      }
      
      throw error
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    console.log('✅ File uploaded successfully:', publicUrl)
    
    return {
      publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('❌ Failed to upload to storage:', error)
    return {
      publicUrl: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Create a signed URL for private bucket access
 */
export async function createSignedUrl(
  bucketName: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn)
    
    if (error) throw error
    
    return data.signedUrl
  } catch (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFromStorage(
  bucketName: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Failed to delete from storage:', error)
    return false
  }
}
