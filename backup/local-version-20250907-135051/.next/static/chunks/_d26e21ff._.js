(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/direct-upload-service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "createSignedUrl": ()=>createSignedUrl,
    "deleteFromStorage": ()=>deleteFromStorage,
    "uploadDirectToStorage": ()=>uploadDirectToStorage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
;
;
async function uploadDirectToStorage(param) {
    let { file, userId, bucketName = 'audio-files' } = param;
    try {
        // Generate unique file name
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop() || 'mp3';
        const fileName = "".concat(timestamp, "-").concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(), ".").concat(fileExt);
        const filePath = userId ? "".concat(userId, "/").concat(fileName) : "anonymous/".concat(fileName);
        console.log('📤 Uploading directly to Supabase Storage:', filePath);
        // Upload directly to Supabase Storage from client
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(bucketName).upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) {
            var _error_message, _error_message1;
            console.error('❌ Storage upload error:', error);
            // Try to create bucket if it doesn't exist
            if (((_error_message = error.message) === null || _error_message === void 0 ? void 0 : _error_message.includes('bucket')) || ((_error_message1 = error.message) === null || _error_message1 === void 0 ? void 0 : _error_message1.includes('not found'))) {
                console.log('🪣 Bucket might not exist, please create it in Supabase dashboard');
                throw new Error('Storage bucket not configured. Please contact support.');
            }
            throw error;
        }
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(bucketName).getPublicUrl(filePath);
        console.log('✅ File uploaded successfully:', publicUrl);
        return {
            publicUrl,
            path: filePath
        };
    } catch (error) {
        console.error('❌ Failed to upload to storage:', error);
        return {
            publicUrl: '',
            path: '',
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}
async function createSignedUrl(bucketName, path) {
    let expiresIn = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 3600;
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(bucketName).createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data.signedUrl;
    } catch (error) {
        console.error('Failed to create signed URL:', error);
        return null;
    }
}
async function deleteFromStorage(bucketName, path) {
    try {
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].storage.from(bucketName).remove([
            path
        ]);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Failed to delete from storage:', error);
        return false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/transcription-service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "checkTranscriptionStatus": ()=>checkTranscriptionStatus,
    "formatDuration": ()=>formatDuration,
    "formatFileSize": ()=>formatFileSize,
    "getAudioDuration": ()=>getAudioDuration,
    "pollTranscriptionStatus": ()=>pollTranscriptionStatus,
    "submitTranscription": ()=>submitTranscription,
    "submitTranscriptionWithUpdates": ()=>submitTranscriptionWithUpdates,
    "subscribeToTranscriptionStatus": ()=>subscribeToTranscriptionStatus,
    "validateAudioFile": ()=>validateAudioFile
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$direct$2d$upload$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/direct-upload-service.ts [app-client] (ecmascript)");
;
;
// Use optimized endpoint by default
const USE_OPTIMIZED_API = true;
async function submitTranscription(request) {
    try {
        var _session_user;
        // Get the current session for user ID
        const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        const userId = session === null || session === void 0 ? void 0 : (_session_user = session.user) === null || _session_user === void 0 ? void 0 : _session_user.id;
        // Step 1: Upload file directly to Supabase Storage from client
        // This bypasses Vercel's 4.5MB limit entirely
        console.log('Uploading file directly to Supabase Storage...');
        const uploadResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$direct$2d$upload$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uploadDirectToStorage"])({
            file: request.audioFile,
            userId
        });
        if (uploadResult.error) {
            throw new Error(uploadResult.error);
        }
        // Step 2: Send only metadata and storage URL to our API
        // This payload is tiny (just a few KB)
        const payload = {
            audioUrl: uploadResult.publicUrl,
            audioPath: uploadResult.path,
            fileName: request.audioFile.name,
            fileSize: request.audioFile.size,
            fileType: request.audioFile.type,
            doctorName: request.doctorName,
            patientName: request.patientName,
            documentType: request.documentType
        };
        const endpoint = ("TURBOPACK compile-time truthy", 1) ? '/api/transcribe-optimized' : "TURBOPACK unreachable";
        const headers = {
            'Content-Type': 'application/json'
        };
        if (session === null || session === void 0 ? void 0 : session.access_token) {
            headers['Authorization'] = "Bearer ".concat(session.access_token);
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit transcription');
        }
        return data;
    } catch (error) {
        console.error('Transcription submission error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit transcription',
            message: 'Please try again or contact support if the issue persists'
        };
    }
}
async function checkTranscriptionStatus(transcriptionId) {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('transcriptions').select('id, status, transcription_text, audio_url, error').eq('id', transcriptionId).single();
        if (error) {
            console.error('Status check error:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Failed to check transcription status:', error);
        return null;
    }
}
async function pollTranscriptionStatus(transcriptionId, onUpdate) {
    let maxAttempts = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 60, intervalMs = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 5000;
    let attempts = 0;
    return new Promise((resolve)=>{
        const interval = setInterval(async ()=>{
            attempts++;
            const status = await checkTranscriptionStatus(transcriptionId);
            if (status) {
                if (onUpdate) {
                    onUpdate(status);
                }
                if (status.status === 'completed' || status.status === 'failed') {
                    clearInterval(interval);
                    resolve(status);
                    return;
                }
            }
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                resolve(null);
            }
        }, intervalMs);
    });
}
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '-';
    const k = 1024;
    const sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB'
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
function validateAudioFile(file) {
    const MAX_SIZE = 100 * 1024 * 1024 // 100MB
    ;
    const ALLOWED_TYPES = [
        'audio/mpeg',
        'audio/wav',
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/mp3',
        'audio/x-wav',
        'audio/wave'
    ];
    if (file.size > MAX_SIZE) {
        return {
            valid: false,
            error: "File size exceeds maximum of ".concat(formatFileSize(MAX_SIZE))
        };
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
        return {
            valid: false,
            error: 'Invalid audio format. Please upload MP3, WAV, M4A, OGG, or WebM files'
        };
    }
    return {
        valid: true
    };
}
async function getAudioDuration(file) {
    return new Promise((resolve, reject)=>{
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.addEventListener('loadedmetadata', ()=>{
            URL.revokeObjectURL(objectUrl);
            resolve(audio.duration);
        });
        audio.addEventListener('error', ()=>{
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load audio file'));
        });
        audio.src = objectUrl;
    });
}
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return "".concat(hours, ":").concat(minutes.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'));
    }
    return "".concat(minutes, ":").concat(secs.toString().padStart(2, '0'));
}
async function subscribeToTranscriptionStatus(transcriptionId, onUpdate, onError, onComplete) {
    try {
        const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        if (!(session === null || session === void 0 ? void 0 : session.access_token)) {
            const error = new Error('No authentication token available');
            if (onError) onError(error);
            return ()=>{} // Return empty cleanup function
            ;
        }
        const token = encodeURIComponent(session.access_token);
        const eventSource = new EventSource("/api/transcription-status?id=".concat(transcriptionId, "&token=").concat(token));
        eventSource.onmessage = (event)=>{
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'status') {
                    onUpdate(data.data);
                } else if (data.type === 'complete') {
                    if (onComplete) onComplete();
                    eventSource.close();
                } else if (data.type === 'error' || data.type === 'timeout') {
                    if (onError) onError(data);
                    eventSource.close();
                }
            } catch (error) {
                console.error('SSE parse error:', error);
                if (onError) onError(error instanceof Error ? error : new Error(String(error)));
            }
        };
        eventSource.onerror = (error)=>{
            console.error('SSE connection error:', error);
            if (onError) onError(error);
            eventSource.close();
        };
        // Return cleanup function
        return ()=>{
            eventSource.close();
        };
    } catch (error) {
        console.error('Failed to create EventSource connection:', error);
        // Fallback to polling if EventSource fails
        console.log('🔄 Falling back to polling for transcription status updates');
        return pollTranscriptionStatus(transcriptionId, onUpdate, 60, 2000);
    }
}
async function submitTranscriptionWithUpdates(request, onStatusUpdate) {
    try {
        // Submit the transcription
        const response = await submitTranscription(request);
        if (response.success && response.transcriptionId) {
            // Subscribe to status updates
            const unsubscribe = await subscribeToTranscriptionStatus(response.transcriptionId, (status)=>{
                if (onStatusUpdate) {
                    onStatusUpdate(status);
                }
            }, (error)=>{
                console.error('Status update error:', error);
            }, ()=>{
                console.log('Transcription complete');
            });
            // Store unsubscribe function for later cleanup if needed
            const responseWithUnsubscribe = response;
            responseWithUnsubscribe.unsubscribe = unsubscribe;
        }
        return response;
    } catch (error) {
        console.error('Submit with updates error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit transcription',
            message: 'Please try again'
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/uuid/dist/esm-browser/native.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
const __TURBOPACK__default__export__ = {
    randomUUID
};
}),
"[project]/node_modules/uuid/dist/esm-browser/rng.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>rng
});
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}
}),
"[project]/node_modules/uuid/dist/esm-browser/regex.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
const __TURBOPACK__default__export__ = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
}),
"[project]/node_modules/uuid/dist/esm-browser/validate.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$regex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/regex.js [app-client] (ecmascript)");
;
function validate(uuid) {
    return typeof uuid === 'string' && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$regex$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].test(uuid);
}
const __TURBOPACK__default__export__ = validate;
}),
"[project]/node_modules/uuid/dist/esm-browser/stringify.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__,
    "unsafeStringify": ()=>unsafeStringify
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$validate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/validate.js [app-client] (ecmascript)");
;
const byteToHex = [];
for(let i = 0; i < 256; ++i){
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    const uuid = unsafeStringify(arr, offset);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$validate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
const __TURBOPACK__default__export__ = stringify;
}),
"[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$native$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/native.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$rng$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/rng.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$stringify$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/stringify.js [app-client] (ecmascript)");
;
;
;
function v4(options, buf, offset) {
    var _options_rng;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$native$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].randomUUID && !buf && !options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$native$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].randomUUID();
    }
    options = options || {};
    var _options_random, _ref;
    const rnds = (_ref = (_options_random = options.random) !== null && _options_random !== void 0 ? _options_random : (_options_rng = options.rng) === null || _options_rng === void 0 ? void 0 : _options_rng.call(options)) !== null && _ref !== void 0 ? _ref : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$rng$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError("UUID byte range ".concat(offset, ":").concat(offset + 15, " is out of buffer bounds"));
        }
        for(let i = 0; i < 16; ++i){
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$stringify$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["unsafeStringify"])(rnds);
}
const __TURBOPACK__default__export__ = v4;
}),
"[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "v4": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript)");
}),
}]);

//# sourceMappingURL=_d26e21ff._.js.map