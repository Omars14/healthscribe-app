module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

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
"[project]/src/lib/supabase.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "getSupabaseAdmin": ()=>getSupabaseAdmin,
    "supabase": ()=>supabase
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-ssr] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://yaznemrwbingjwqutbvb.supabase.co") || '';
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo") || '';
const supabase = ("TURBOPACK compile-time truthy", 1) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Use PKCE flow for better security
    },
    global: {
        headers: {
            'X-Client-Info': 'healthscribe-dashboard'
        }
    }
}) : "TURBOPACK unreachable";
const getSupabaseAdmin = ()=>{
    // Only run on server side
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('⚠️ Supabase admin client: Missing URL or service key');
        return null;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            headers: {
                'X-Client-Info': 'healthscribe-dashboard-admin'
            }
        }
    });
};
// Debug logging for client initialization (only in development)
if ("TURBOPACK compile-time truthy", 1) {
    console.log('🔧 Supabase client initialization:');
    console.log('  - URL present:', !!supabaseUrl);
    console.log('  - Anon key present:', !!supabaseAnonKey);
    console.log('  - Regular client initialized:', !!supabase);
}
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

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
"[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [userProfile, setUserProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // Fetch user profile from database
    const fetchUserProfile = async (userId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
            console.log('🔄 AuthContext: No Supabase client available');
            setLoading(false);
            return;
        }
        console.log('🔄 AuthContext: Fetching profile for user:', userId);
        try {
            console.log('🔄 AuthContext: Querying user_profiles table...');
            // Add timeout to prevent hanging queries
            const timeoutPromise = new Promise((_, reject)=>setTimeout(()=>reject(new Error('Profile query timeout')), 10000));
            // Query user profile directly with timeout
            const queryPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').select('*').eq('id', userId).single();
            console.log('🔄 AuthContext: Starting profile query with 10s timeout...');
            const { data, error } = await Promise.race([
                queryPromise,
                timeoutPromise
            ]);
            console.log('🔄 AuthContext: Profile query result:', {
                hasData: !!data,
                hasError: !!error,
                errorCode: error?.code,
                errorMessage: error?.message
            });
            if (error) {
                console.log('🔄 AuthContext: Profile fetch error:', error.message);
                // Handle timeout or RLS issues
                if (error.message === 'Profile query timeout') {
                    console.log('🔄 AuthContext: Query timed out - likely RLS policy issue');
                    console.log('🔄 AuthContext: Proceeding without profile to avoid infinite loading');
                    setUserProfile(null);
                    setLoading(false);
                    return;
                }
                // If profile doesn't exist, create one
                if (error.code === 'PGRST116') {
                    console.log('🔄 AuthContext: Profile not found, creating new profile...');
                    const { data: userData } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
                    console.log('🔄 AuthContext: Current user data:', {
                        hasUser: !!userData?.user,
                        userEmail: userData?.user?.email,
                        userName: userData?.user?.user_metadata?.name
                    });
                    if (userData?.user) {
                        console.log('🔄 AuthContext: Creating new user profile...');
                        try {
                            const createPromise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').insert({
                                id: userId,
                                email: userData.user.email,
                                full_name: userData.user.user_metadata?.name || null,
                                role: 'transcriptionist'
                            }).select().single();
                            const { data: newProfile, error: createError } = await Promise.race([
                                createPromise,
                                new Promise((_, reject)=>setTimeout(()=>reject(new Error('Profile creation timeout')), 5000))
                            ]);
                            console.log('🔄 AuthContext: Profile creation result:', {
                                hasProfile: !!newProfile,
                                hasCreateError: !!createError,
                                createErrorMessage: createError?.message
                            });
                            if (!createError && newProfile) {
                                console.log('🔄 AuthContext: Profile created successfully:', newProfile);
                                setUserProfile(newProfile);
                            } else if (createError?.message === 'Profile creation timeout') {
                                console.log('🔄 AuthContext: Profile creation timed out, proceeding without profile');
                                setUserProfile(null);
                            } else {
                                console.log('🔄 AuthContext: Profile creation failed, proceeding without profile');
                                setUserProfile(null);
                            }
                        } catch (createErr) {
                            console.log('🔄 AuthContext: Profile creation exception, proceeding without profile:', createErr);
                            setUserProfile(null);
                        }
                    } else {
                        console.log('🔄 AuthContext: No user data available, proceeding without profile');
                        setUserProfile(null);
                    }
                } else {
                    console.log('🔄 AuthContext: Other profile error, proceeding without profile:', error.message);
                    setUserProfile(null);
                }
            } else if (data) {
                console.log('🔄 AuthContext: Profile fetched successfully:', data);
                setUserProfile(data);
            }
            console.log('🔄 AuthContext: Profile fetch operation completed');
            setLoading(false);
        } catch (error) {
            console.error('🔄 AuthContext: Exception in fetchUserProfile:', error);
            // Handle timeout specifically
            if (error.message === 'Profile query timeout') {
                console.log('🔄 AuthContext: Profile query timed out - this suggests RLS policy issues');
                console.log('🔄 AuthContext: User can still access the app, but profile features may be limited');
            }
            // If profile fetching fails completely, proceed without profile
            console.log('🔄 AuthContext: Proceeding without profile due to error');
            setUserProfile(null);
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) {
            setLoading(false);
            return;
        }
        // Check for existing session manually
        const checkSession = async ()=>{
            try {
                const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                if (error) {
                    console.error('Session check error:', error);
                    setLoading(false);
                    return;
                }
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally{
                setLoading(false);
            }
        };
        checkSession();
        // Listen for auth changes
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange(async (event, session)=>{
            console.log('🔄 AuthContext: Auth state changed:', {
                event,
                hasSession: !!session,
                hasUser: !!session?.user,
                userEmail: session?.user?.email,
                sessionExpiry: session?.expires_at
            });
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                console.log('🔄 AuthContext: User logged in, fetching profile...');
                await fetchUserProfile(session.user.id);
            } else {
                console.log('🔄 AuthContext: User logged out, clearing profile');
                setUserProfile(null);
            }
            setLoading(false);
        });
        return ()=>subscription.unsubscribe();
    }, []);
    // Separate effect to handle redirects after authentication
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Only redirect if we're not in the middle of loading and have a user
        // Profile is optional - user can still access the app without a profile
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        user,
        loading,
        router
    ]); // Removed userProfile dependency
    const signIn = async (email, password)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return {
            error: new Error('Supabase client not available')
        };
        try {
            console.log('🔐 Attempting login for:', email);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                console.error('🔐 Login error:', error);
                throw error;
            }
            console.log('🔐 Login successful, user:', data.user?.email);
            console.log('🔐 Session data:', {
                hasSession: !!data.session,
                sessionExpiry: data.session?.expires_at
            });
            // Wait a moment for the auth state to propagate
            await new Promise((resolve)=>setTimeout(resolve, 100));
            console.log('🔐 Redirecting to dashboard...');
            router.push('/dashboard');
            return {
                error: null
            };
        } catch (error) {
            console.error('🔐 Login failed:', error);
            return {
                error: error
            };
        }
    };
    const signUp = async (email, password, metadata)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return {
            error: new Error('Supabase client not available')
        };
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://healthscribepro.vercel.app'}/login`
                }
            });
            if (error) throw error;
            return {
                error: null
            };
        } catch (error) {
            return {
                error: error
            };
        }
    };
    const signOut = async ()=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return;
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if (error) throw error;
            router.push('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
    const resetPassword = async (email)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return {
            error: new Error('Supabase client not available')
        };
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            return {
                error: null
            };
        } catch (error) {
            return {
                error: error
            };
        }
    };
    const updateUserRole = async (userId, role)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return {
            error: new Error('Supabase client not available')
        };
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').update({
                role
            }).eq('id', userId);
            if (error) throw error;
            // Refresh profile if updating current user
            if (userId === user?.id) {
                await fetchUserProfile(userId);
            }
            return {
                error: null
            };
        } catch (error) {
            return {
                error: error
            };
        }
    };
    const assignEditor = async (transcriptionistId, editorId)=>{
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"]) return {
            error: new Error('Supabase client not available')
        };
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').update({
                assigned_editor_id: editorId
            }).eq('id', transcriptionistId);
            if (error) throw error;
            return {
                error: null
            };
        } catch (error) {
            return {
                error: error
            };
        }
    };
    const value = {
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserRole,
        assignEditor
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 381,
        columnNumber: 10
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
}),
"[project]/src/app/providers.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Providers": ()=>Providers
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)");
'use client';
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthProvider"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__e79b4817._.js.map