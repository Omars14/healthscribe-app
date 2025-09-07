module.exports = {

"[project]/.next-internal/server/app/api/transcribe-optimized/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/punycode [external] (punycode, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[project]/src/lib/supabase-server.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "createServerClient": ()=>createServerClient,
    "supabaseServer": ()=>supabaseServer
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
// Server-side Supabase client using service role key
// This bypasses RLS policies and should only be used in server-side code
const supabaseUrl = ("TURBOPACK compile-time value", "https://yaznemrwbingjwqutbvb.supabase.co") || process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo") || '';
// During build time, environment variables might not be available
// We'll create a dummy client that will be replaced at runtime
const isDevelopmentOrBuild = ("TURBOPACK compile-time value", "development") === 'development' || !supabaseUrl;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabaseServer = ("TURBOPACK compile-time truthy", 1) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}) : "TURBOPACK unreachable";
const createServerClient = (accessToken)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: accessToken ? {
                Authorization: `Bearer ${accessToken}`
            } : {}
        }
    });
};
}),
"[externals]/crypto [external] (crypto, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[project]/src/app/api/transcribe-optimized/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "POST": ()=>POST,
    "maxDuration": ()=>maxDuration,
    "runtime": ()=>runtime
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase-server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-route] (ecmascript) <export default as v4>");
;
;
;
const runtime = 'nodejs';
const maxDuration = 60 // 60 seconds timeout
;
async function POST(request) {
    try {
        // Check Content-Type to handle both JSON and FormData
        const contentType = request.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        // Get authorization header if present
        const authHeader = request.headers.get('authorization');
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Verify the token and get user using server client
            const { data: { user }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].auth.getUser(token);
            if (user && !error) {
                userId = user.id;
                console.log('Authenticated user for upload:', user.email, 'ID:', userId);
            } else {
                console.log('Auth error:', error?.message);
            }
        } else {
            console.log('No auth header provided, creating transcription without user_id');
        }
        let audioUrl;
        let fileName;
        let fileSize;
        let fileType;
        let doctorName;
        let patientName;
        let documentType;
        if (isJson) {
            // Handle JSON payload (file already uploaded to storage)
            const data = await request.json();
            audioUrl = data.audioUrl;
            fileName = data.fileName;
            fileSize = data.fileSize;
            fileType = data.fileType || 'audio/mpeg';
            doctorName = data.doctorName;
            patientName = data.patientName;
            documentType = data.documentType;
            if (!audioUrl) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No audio URL provided'
                }, {
                    status: 400
                });
            }
            console.log('Received pre-uploaded file:', {
                fileName,
                fileSize,
                audioUrl
            });
        } else {
            // Handle FormData (legacy support for small files)
            const formData = await request.formData();
            const audioFile = formData.get('audio');
            doctorName = formData.get('doctorName');
            patientName = formData.get('patientName');
            documentType = formData.get('documentType');
            if (!audioFile) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No audio file provided'
                }, {
                    status: 400
                });
            }
            fileName = audioFile.name;
            fileSize = audioFile.size;
            fileType = audioFile.type;
            // Upload to storage (for backward compatibility)
            audioUrl = await uploadAudioToStorage(audioFile, userId);
        }
        // Step 2: Create database record with audio URL
        const transcription = await createTranscriptionRecord({
            fileName,
            doctorName,
            patientName,
            documentType,
            fileSize,
            userId,
            audioUrl
        });
        if (!transcription) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Failed to create transcription record'
            }, {
                status: 500
            });
        }
        // Step 3: Send to n8n - IMPORTANT: We need to await briefly to ensure it starts
        console.log('🎯 About to call sendToN8NAsync for transcription:', transcription.id);
        console.log('📊 Audio URL being sent to n8n:', audioUrl);
        console.log('📊 Metadata:', {
            doctorName,
            patientName,
            documentType
        });
        // Start the n8n webhook call but use Promise.race to return quickly
        // This ensures the function starts but we don't wait for it to complete
        const n8nPromise = sendToN8NAsync(transcription.id, {
            fileName,
            fileSize,
            fileType
        }, {
            doctorName,
            patientName,
            documentType
        }, audioUrl).then(()=>{
            console.log('✅ N8N webhook call completed successfully');
        }).catch((error)=>{
            console.error('❌ Background n8n processing error:', error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                cause: error.cause
            });
            // Update status to indicate n8n processing failed
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').update({
                status: 'failed',
                error: error.message
            }).eq('id', transcription.id).then(()=>{
                console.log('Updated transcription status to failed');
            });
        });
        // Wait for either the n8n call to start (500ms) or complete, whichever comes first
        // This ensures Vercel doesn't kill the function before the HTTP request is sent
        // Increased timeout to ensure the request is actually sent on Vercel
        await Promise.race([
            n8nPromise,
            new Promise((resolve)=>setTimeout(resolve, 500))
        ]);
        // Return immediately with transcription ID
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            transcriptionId: transcription.id,
            status: 'processing',
            message: 'File uploaded successfully. Transcription in progress.'
        });
    } catch (error) {
        console.error('Transcription API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
async function uploadAudioToStorage(file, userId) {
    try {
        // Generate unique file name
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop() || 'mp3';
        const fileName = `${timestamp}-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])()}.${fileExt}`;
        const filePath = userId ? `${userId}/${fileName}` : `anonymous/${fileName}`;
        console.log('📤 Uploading audio to Supabase Storage:', filePath);
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Upload to Supabase Storage
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].storage.from('audio-files').upload(filePath, buffer, {
            contentType: file.type || 'audio/mpeg',
            upsert: false
        });
        if (error) {
            console.error('❌ Storage upload error:', error);
            // Try to create bucket if it doesn't exist
            if (error.message?.includes('bucket') || error.message?.includes('not found')) {
                console.log('🪣 Creating audio-files bucket...');
                const { error: bucketError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].storage.createBucket('audio-files', {
                    public: false,
                    allowedMimeTypes: [
                        'audio/*'
                    ],
                    fileSizeLimit: 52428800 // 50MB
                });
                if (!bucketError || bucketError.message?.includes('already exists')) {
                    // Retry upload
                    const retryResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].storage.from('audio-files').upload(filePath, buffer, {
                        contentType: file.type || 'audio/mpeg',
                        upsert: false
                    });
                    if (retryResult.error) {
                        throw retryResult.error;
                    }
                } else {
                    throw bucketError;
                }
            } else {
                throw error;
            }
        }
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].storage.from('audio-files').getPublicUrl(filePath);
        console.log('✅ Audio uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('❌ Failed to upload audio to storage:', error);
        // Return empty string if upload fails - transcription can still proceed
        return '';
    }
}
async function createTranscriptionRecord(data) {
    try {
        console.log('Creating transcription record with data:', {
            ...data,
            userId: data.userId ? `${data.userId.substring(0, 8)}...` : 'null'
        });
        // First, let's check if the table exists and what columns it has
        const { data: tableCheck, error: tableError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').select('*').limit(1);
        if (tableError && tableError.code === '42P01') {
            console.error('❌ CRITICAL: transcriptions table does not exist!');
            console.error('Please run the SQL schema from src/lib/create-new-database.sql');
            return null;
        }
        // Try to insert with status column, fallback to without if it fails
        let transcription = null;
        let error = null;
        try {
            const insertData = {
                file_name: data.fileName,
                doctor_name: data.doctorName,
                patient_name: data.patientName,
                document_type: data.documentType,
                status: 'pending',
                file_size: data.fileSize,
                transcription_text: '',
                audio_url: data.audioUrl || '',
                user_id: data.userId || null,
                created_at: new Date().toISOString()
            };
            console.log('Attempting insert with data:', insertData);
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').insert(insertData).select().single();
            transcription = result.data;
            error = result.error;
            if (error) {
                console.log('First insert attempt failed, trying fallback...');
            }
        } catch (e) {
            console.log('Exception in first insert:', e);
            // If status column doesn't exist, try without it
            const fallbackData = {
                file_name: data.fileName,
                doctor_name: data.doctorName,
                patient_name: data.patientName,
                document_type: data.documentType,
                transcription_text: '',
                audio_url: data.audioUrl || '',
                user_id: data.userId || null,
                created_at: new Date().toISOString()
            };
            console.log('Attempting fallback insert without status column:', fallbackData);
            const fallbackResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').insert(fallbackData).select().single();
            transcription = fallbackResult.data;
            error = fallbackResult.error;
        }
        if (error) {
            console.error('❌ Database error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                data: data
            });
            // Check if it's an RLS policy issue
            if (error.code === '42501') {
                console.error('❌ RLS Policy Error: The user does not have permission to insert.');
                console.error('Possible solutions:');
                console.error('1. Check if user is authenticated');
                console.error('2. Check RLS policies on transcriptions table');
                console.error('3. Temporarily disable RLS for testing');
            }
            return null;
        }
        console.log('✅ Transcription record created successfully:', transcription?.id);
        return transcription;
    } catch (error) {
        console.error('❌ Failed to create transcription record:', error);
        return null;
    }
}
// Removed processAudioFile function - no longer needed since we upload to storage
async function sendToN8NAsync(transcriptionId, fileInfo, metadata, audioUrl) {
    try {
        console.log('🔔 Starting n8n webhook call for transcription:', transcriptionId);
        console.log('🔔 Function parameters:', {
            transcriptionId,
            fileInfo,
            metadata,
            audioUrl: audioUrl ? 'URL provided' : 'NO URL!'
        });
        // Try to update status if column exists
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').update({
                status: 'in_progress'
            }).eq('id', transcriptionId);
        } catch (e) {
            console.log('Status column not available, skipping status update');
        }
        // Get n8n Cloud webhook URL
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ("TURBOPACK compile-time value", "https://project6.app.n8n.cloud/webhook/medical-transcribe-v2") || 'https://project6.app.n8n.cloud/webhook/medical-transcribe-v2';
        console.log('🔗 N8N webhook URL:', N8N_WEBHOOK_URL);
        console.log('🔗 Environment check:', {
            'N8N_WEBHOOK_URL': process.env.N8N_WEBHOOK_URL ? 'SET' : 'NOT SET',
            'NEXT_PUBLIC_N8N_WEBHOOK_URL': ("TURBOPACK compile-time truthy", 1) ? 'SET' : "TURBOPACK unreachable",
            'NODE_ENV': ("TURBOPACK compile-time value", "development"),
            'VERCEL': process.env.VERCEL ? 'YES' : 'NO'
        });
        // Determine callback URL for production
        let callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard-next.vercel.app'}/api/transcription-result-v2`;
        const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '4ipofkderor13UDpoR8QzvmpE2WZZC8h';
        if (process.env.VERCEL_URL) {
            // Add bypass token to allow n8n to access the protected endpoint
            callbackUrl = `https://${process.env.VERCEL_URL}/api/transcription-result-v2?x-vercel-protection-bypass=${bypassSecret}`;
        } else if (("TURBOPACK compile-time value", "development") === 'production' || process.env.VERCEL) {
            // Use the main production URL with bypass token
            callbackUrl = `https://dashboard-next.vercel.app/api/transcription-result-v2?x-vercel-protection-bypass=${bypassSecret}`;
        }
        // Prepare JSON payload for n8n Cloud webhook (send directly, not wrapped)
        const webhookPayload = {
            // Match the expected fields from the n8n workflow
            uploadId: transcriptionId,
            audioUrl: audioUrl,
            fileName: fileInfo.fileName || 'audio.mp3',
            doctorName: metadata.doctorName || '',
            patientName: metadata.patientName || '',
            documentType: metadata.documentType || '',
            callbackUrl: callbackUrl,
            // Additional metadata
            fileSize: fileInfo.fileSize,
            fileType: fileInfo.fileType || 'audio/mpeg',
            isLargeFile: fileInfo.fileSize > 5 * 1024 * 1024,
            audioSource: 'url',
            uploadTime: new Date().toISOString(),
            source: 'dashboard-next'
        };
        console.log('📦 Webhook payload prepared:', {
            fileName: webhookPayload.fileName,
            fileSize: webhookPayload.fileSize,
            uploadId: webhookPayload.uploadId,
            doctorName: webhookPayload.doctorName,
            patientName: webhookPayload.patientName,
            documentType: webhookPayload.documentType,
            audioUrl: webhookPayload.audioUrl ? '[url]' : ''
        });
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeout = setTimeout(()=>controller.abort(), 45000) // 45 second timeout (longer for large files)
        ;
        try {
            console.log('🚀 Sending POST request to n8n webhook...');
            console.log('🚀 Full URL:', N8N_WEBHOOK_URL);
            console.log('🚀 Payload size:', JSON.stringify(webhookPayload).length, 'bytes');
            console.log('🚀 Request headers:', {
                'Content-Type': 'application/json',
                'X-Request-ID': transcriptionId,
                'X-Source': 'dashboard-next'
            });
            // Send JSON payload to n8n webhook
            const startTime = Date.now();
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': transcriptionId,
                    'X-Source': 'dashboard-next'
                },
                body: JSON.stringify(webhookPayload),
                signal: controller.signal
            });
            const endTime = Date.now();
            console.log(`🚀 Request took ${endTime - startTime}ms`);
            clearTimeout(timeout);
            console.log('📨 N8N webhook response status:', response.status);
            // Get response text first
            let responseText = '';
            try {
                responseText = await response.text();
            } catch (e) {
                console.log('Could not read response text:', e);
            }
            // Handle various response scenarios
            if (response.status === 200 || response.status === 201 || response.status === 202) {
                console.log('✅ N8N webhook accepted the request');
                // Try to parse response as JSON
                let responseData = null;
                try {
                    if (responseText) {
                        responseData = JSON.parse(responseText);
                    }
                } catch (e) {
                    // Not JSON, that's okay
                    console.log('Response is not JSON:', responseText.substring(0, 100));
                }
                // Update status to processing
                try {
                    const updateData = {
                        status: 'processing'
                    };
                    if (responseData) {
                        updateData.metadata = {
                            n8nResponse: responseData
                        };
                    }
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').update(updateData).eq('id', transcriptionId);
                } catch (e) {
                    console.log('Could not update status/metadata:', e);
                }
                return; // Success
            }
            // Handle "No item to return" as success (n8n async processing)
            if (!response.ok && responseText && responseText.includes('No item to return')) {
                console.log('✅ N8N webhook accepted for async processing');
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').update({
                        status: 'processing',
                        metadata: {
                            note: 'N8N async processing'
                        }
                    }).eq('id', transcriptionId);
                } catch (e) {
                    console.log('Could not update status:', e);
                }
                return; // Success - async processing
            }
            // Handle error responses
            if (!response.ok) {
                const errorMessage = `N8N webhook failed with status ${response.status}`;
                console.error(`❌ ${errorMessage}:`, responseText ? responseText.substring(0, 200) : 'No response body');
                throw new Error(errorMessage);
            }
        } catch (error) {
            clearTimeout(timeout);
            if (error instanceof Error && error.name === 'AbortError') {
                console.error('❌ N8N request timeout after 45 seconds');
                throw new Error('N8N request timeout - the file may be too large or the service is unavailable');
            }
            // Log detailed error information
            console.error('❌ Fetch error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                cause: error instanceof Error ? error.cause : undefined,
                code: error.code,
                errno: error.errno,
                syscall: error.syscall
            });
            throw error;
        }
    } catch (error) {
        console.error('❌ N8N webhook error:', error);
        // Try to update status to failed
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').update({
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }).eq('id', transcriptionId);
        } catch (e) {
            console.log('Could not update error status:', e);
        }
        throw error;
    }
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const transcriptionId = searchParams.get('id');
        if (!transcriptionId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Transcription ID required'
            }, {
                status: 400
            });
        }
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"].from('transcriptions').select('*').eq('id', transcriptionId).single();
        if (error || !data) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Transcription not found'
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            transcription: data
        });
    } catch (error) {
        console.error('Status check error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to check status'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__51abc30c._.js.map