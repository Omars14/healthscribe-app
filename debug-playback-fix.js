#!/usr/bin/env node

/**
 * Debug and Fix Audio Playback in Transcriptionist Workspace
 * This script checks:
 * 1. Database schema for audio_url column
 * 2. API response includes audio_url
 * 3. Audio URLs are valid and accessible
 * 4. Adds better error logging to help identify issues
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_FILE = 'src/app/dashboard/transcriptionist-workspace.tsx';
const API_FILE = 'src/app/api/workspace-transcriptions/route.ts';

console.log('🔍 Starting audio playback diagnostics...\n');

// Step 1: Check workspace component for audio element
console.log('📋 Step 1: Checking workspace component...');
const workspaceContent = fs.readFileSync(WORKSPACE_FILE, 'utf8');

const hasAudioElement = workspaceContent.includes('audio') && workspaceContent.includes('audioRef');
const hasTogglePlayPause = workspaceContent.includes('const togglePlayPause');
const audioElementMatch = workspaceContent.match(/<audio[\s\S]*?\/>/);

console.log('  ✓ Has audioRef:', hasAudioElement);
console.log('  ✓ Has togglePlayPause:', hasTogglePlayPause);
console.log('  ✓ Audio element found:', !!audioElementMatch);

if (audioElementMatch) {
  console.log('  Audio element code:\n', audioElementMatch[0].substring(0, 200) + '...\n');
}

// Step 2: Check API route
console.log('📋 Step 2: Checking API route...');
const apiContent = fs.readFileSync(API_FILE, 'utf8');

const hasSelect = apiContent.includes('select');
const selectMatch = apiContent.match(/\.select\(['"`]([^'"`]+)['""`]\)/);

console.log('  ✓ Has select statement:', hasSelect);
if (selectMatch) {
  console.log('  Selected fields:', selectMatch[1]);
  if (selectMatch[1].includes('audio_url')) {
    console.log('  ✓ audio_url is selected');
  } else {
    console.log('  ⚠️  WARNING: audio_url may not be selected!');
  }
}

// Step 3: Propose fixes
console.log('\n🔧 Recommended Fixes:\n');

console.log('FIX 1: Add detailed console logging to audio element');
console.log('-------');
const audioFixCode = `
// Add to the audio element handlers:
<audio
  ref={audioRef}
  src={selectedTranscription.audio_url}
  onTimeUpdate={(e) => {
    console.log('🎵 Time update:', e.currentTarget.currentTime, '/', e.currentTarget.duration);
    setCurrentTime(e.currentTarget.currentTime)
  }}
  onLoadedMetadata={(e) => {
    console.log('✅ Audio loaded, duration:', e.currentTarget.duration);
    setDuration(e.currentTarget.duration)
  }}
  onEnded={() => {
    console.log('🎵 Audio ended');
    setIsPlaying(false)
  }}
  onError={(e) => {
    console.error('❌ Audio error:', e.currentTarget.error);
  }}
  onCanPlay={() => {
    console.log('✅ Audio can play');
  }}
/>
`;
console.log(audioFixCode);

console.log('\nFIX 2: Ensure API returns audio_url');
console.log('-------');
const apiFix = `
// In workspace-transcriptions/route.ts, change:
const { data, error } = await supabase
  .from('transcriptions')
  .select('*')  // Explicit selection of all columns
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(100)

// OR be explicit about audio_url:
const { data, error } = await supabase
  .from('transcriptions')
  .select('id, file_name, doctor_name, patient_name, document_type, transcription_text, audio_url, created_at, status, file_size, user_id')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(100)
`;
console.log(apiFix);

console.log('\nFIX 3: Add error handling in togglePlayPause');
console.log('-------');
const toggleFix = `
const togglePlayPause = () => {
  if (!audioRef.current) {
    console.error('❌ Audio ref not available');
    return;
  }

  const audio = audioRef.current;
  
  // Debug: Check audio state
  console.log('🎵 Audio element:', {
    src: audio.src,
    duration: audio.duration,
    canPlay: audio.readyState >= 2,
    error: audio.error
  });
  
  if (isPlaying) {
    console.log('⏸️ Pausing audio');
    audio.pause();
  } else {
    console.log('▶️ Playing audio');
    audio.play().catch(err => {
      console.error('❌ Play error:', err);
    });
  }
  setIsPlaying(!isPlaying);
}
`;
console.log(toggleFix);

console.log('\nFIX 4: Browser console debugging steps');
console.log('-------');
console.log(`
1. Open browser DevTools (F12)
2. Go to Console tab
3. Select a transcription with audio
4. Check if "Audio element:" log appears
5. Verify audio_url is populated: Check in Network tab > XHR/Fetch for workspace-transcriptions response
6. Check if audio element shows error: audioRef.current?.error
7. Verify CORS: Check Network tab > audio request headers
8. Try playing and watch for error messages
`);

console.log('\n✅ Diagnostics complete!');
console.log('📝 Next steps:');
console.log('  1. Apply the fixes above to the component');
console.log('  2. Check browser console for audio loading errors');
console.log('  3. Verify audio_url values in API response');
console.log('  4. Check Supabase storage bucket CORS configuration');
