# Supported Audio Formats

## Overview
The HealthScribe medical transcription system supports a comprehensive range of audio formats, ensuring compatibility with virtually all medical dictation devices and recording equipment.

## Supported Formats

### 1. **MP3 (MPEG Audio Layer 3)** ✅
- **Extensions**: `.mp3`
- **MIME Types**: `audio/mpeg`, `audio/mp3`
- **Quality**: Lossy compression
- **Best For**: General purpose, good quality-to-size ratio
- **Common Use**: Digital voice recorders, smartphones

### 2. **WAV (Waveform Audio File Format)** ✅
- **Extensions**: `.wav`
- **MIME Types**: `audio/wav`, `audio/x-wav`, `audio/wave`, `audio/vnd.wave`
- **Quality**: Uncompressed or lossless
- **Best For**: Highest quality recordings
- **Common Use**: Professional dictation devices, studio recordings

### 3. **M4A / AAC (Advanced Audio Coding)** ✅
- **Extensions**: `.m4a`, `.aac`, `.mp4`
- **MIME Types**: `audio/m4a`, `audio/x-m4a`, `audio/aac`, `audio/aacp`, `audio/mp4`
- **Quality**: Lossy compression, better than MP3 at same bitrate
- **Best For**: Apple devices, modern smartphones
- **Common Use**: iPhone recordings, iPad dictation

### 4. **FLAC (Free Lossless Audio Codec)** ✅
- **Extensions**: `.flac`
- **MIME Types**: `audio/flac`, `audio/x-flac`
- **Quality**: Lossless compression (50-70% of original size)
- **Best For**: Archival quality with compression
- **Common Use**: High-quality medical recordings, legal documentation

### 5. **OGG / Opus** ✅
- **Extensions**: `.ogg`, `.opus`
- **MIME Types**: `audio/ogg`, `audio/opus`, `audio/x-opus+ogg`
- **Quality**: Lossy compression, excellent quality
- **Best For**: Web-based recordings, modern applications
- **Common Use**: Browser-based voice recorders

### 6. **WebM** ✅
- **Extensions**: `.webm`
- **MIME Types**: `audio/webm`
- **Quality**: Lossy compression
- **Best For**: Web recordings, browser compatibility
- **Common Use**: Web applications, Chrome recordings

### 7. **AMR (Adaptive Multi-Rate)** ✅
- **Extensions**: `.amr`, `.3gp`
- **MIME Types**: `audio/amr`, `audio/amr-wb`, `audio/amr-wb+`, `audio/3gpp`, `audio/3gpp2`
- **Quality**: Lossy compression, optimized for speech
- **Best For**: Telephony, voice-only recordings
- **Common Use**: Medical dictation devices, phone recordings

## File Size Limits

- **Maximum File Size**: 100 MB per file
- **Recommended Size**: Under 50 MB for optimal processing speed
- **Bulk Upload**: Multiple files supported (up to 100 MB each)

## Quality Recommendations

### For Best Transcription Accuracy:

1. **Sample Rate**: 16 kHz or higher (44.1 kHz recommended)
2. **Bit Depth**: 16-bit minimum (24-bit for archival)
3. **Bitrate**: 
   - MP3: 128 kbps minimum, 192-320 kbps recommended
   - AAC: 128 kbps minimum, 256 kbps recommended
4. **Channels**: Mono or Stereo (mono preferred for speech)

### Format Recommendations by Use Case:

| Use Case | Recommended Format | Alternative |
|----------|-------------------|-------------|
| General Dictation | MP3 (192 kbps) | M4A (256 kbps) |
| High-Quality Clinical | WAV | FLAC |
| Mobile/iPhone | M4A | AAC |
| Web-Based | WebM | OGG |
| Phone Recordings | AMR | MP3 |
| Archival | FLAC | WAV |

## Deepgram Compatibility

All supported formats are fully compatible with Deepgram's transcription API, which is used by the system. Deepgram automatically handles:

- Format detection
- Audio preprocessing
- Noise reduction
- Speaker diarization (when available)

## Upload Methods

1. **Single File Upload**: Drag & drop or click to browse
2. **Bulk Upload**: Multiple files simultaneously
3. **File Validation**: Automatic format and size checking

## Technical Details

### Validation Process:
1. File extension check
2. MIME type verification
3. File size validation (< 100 MB)
4. Audio integrity check (optional)

### Supported MIME Types (Complete List):
```
audio/mpeg, audio/mp3
audio/wav, audio/x-wav, audio/wave, audio/vnd.wave
audio/m4a, audio/x-m4a, audio/aac, audio/aacp, audio/mp4, audio/x-m4p
audio/ogg, audio/opus, audio/x-opus+ogg
audio/webm
audio/flac, audio/x-flac
audio/amr, audio/amr-wb, audio/amr-wb+
audio/3gpp, audio/3gpp2
```

## Troubleshooting

### If Your File Is Rejected:

1. **Check File Size**: Ensure it's under 100 MB
2. **Verify Format**: Confirm it's one of the supported formats
3. **Test File**: Try opening it in a media player to ensure it's not corrupted
4. **Convert If Needed**: Use a tool like FFmpeg to convert to a supported format

### Recommended Conversion Tools:

- **Windows**: Audacity (free), Format Factory
- **Mac**: Audacity (free), Switch Audio Converter
- **Linux**: FFmpeg, Audacity
- **Online**: CloudConvert, Online-Convert

## Example FFmpeg Conversions:

```bash
# Convert to MP3 (192 kbps)
ffmpeg -i input.* -codec:a libmp3lame -b:a 192k output.mp3

# Convert to WAV (16-bit, 44.1 kHz)
ffmpeg -i input.* -acodec pcm_s16le -ar 44100 output.wav

# Convert to M4A (AAC 256 kbps)
ffmpeg -i input.* -codec:a aac -b:a 256k output.m4a

# Convert to FLAC (lossless)
ffmpeg -i input.* -codec:a flac output.flac
```

## Need Help?

If you're experiencing issues with a specific audio format, please contact support with:
- File format and extension
- File size
- Recording device/software used
- Any error messages received

---

**Last Updated**: October 12, 2025
**System Version**: 2.0
**Deepgram API**: v1

