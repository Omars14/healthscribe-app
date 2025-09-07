(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/auth-utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "authManager": ()=>authManager,
    "debugAuth": ()=>debugAuth,
    "testAuthFixes": ()=>testAuthFixes
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
;
class AuthManager {
    async initialize() {
        console.log('🔧 AuthManager: Initializing...');
        try {
            // Try to get session immediately on construction
            const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            if (error) {
                console.log('⚠️ AuthManager: Session error during initialization:', error.message);
                this.initialized = true;
                return;
            }
            if (session === null || session === void 0 ? void 0 : session.access_token) {
                this.cachedToken = session.access_token;
                this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                console.log('✅ AuthManager: Initialized with existing session');
            } else {
                console.log('⚠️ AuthManager: No existing session found during initialization');
            }
            this.initialized = true;
            console.log('✅ AuthManager: Initialization complete');
        } catch (error) {
            console.error('❌ AuthManager: Initialization failed:', error);
            // Don't fail initialization - just mark as complete so other methods can work
            this.initialized = true;
            this.cachedToken = null;
            this.tokenExpiry = 0;
        }
    }
    async waitForInitialization() {
        if (!this.initialized) {
            console.log('⏳ AuthManager: Waiting for initialization...');
            // Simple polling since we can't use await in constructor
            while(!this.initialized){
                await new Promise((resolve)=>setTimeout(resolve, 50));
            }
            console.log('✅ AuthManager: Initialization wait complete');
        }
    }
    async getAuthToken() {
        console.log('🚀 AuthManager: getAuthToken called');
        // Wait for initialization to complete
        await this.waitForInitialization();
        // If we have a valid cached token, return it immediately
        if (this.cachedToken && Date.now() < this.tokenExpiry) {
            console.log('✅ AuthManager: Returning cached token, expiry:', new Date(this.tokenExpiry).toISOString());
            return this.cachedToken;
        }
        // If we're already fetching a token, wait for it
        if (this.tokenPromise) {
            console.log('⏳ AuthManager: Waiting for existing token promise');
            return this.tokenPromise;
        }
        console.log('🔄 AuthManager: Starting new token fetch');
        // Start fetching a new token
        this.tokenPromise = this.fetchAuthToken();
        // Don't clear the promise immediately - let all waiting requests get the result
        let token = await this.tokenPromise;
        // If first attempt failed, try one more time after a short delay
        if (!token) {
            console.log('🔄 AuthManager: First attempt failed, retrying...');
            await new Promise((resolve)=>setTimeout(resolve, 500)); // Wait 500ms
            this.tokenPromise = this.fetchAuthToken();
            token = await this.tokenPromise;
            console.log('🔄 AuthManager: Retry result:', !!token);
        }
        // Clear the promise after a short delay to allow all concurrent requests to complete
        setTimeout(()=>{
            console.log('🧹 AuthManager: Clearing token promise');
            this.tokenPromise = null;
        }, 100);
        console.log('🏁 AuthManager: Token fetch completed, hasToken:', !!token);
        return token;
    }
    // Enhanced session refresh method
    async refreshSession() {
        console.log('🔄 AuthManager: Forcing session refresh');
        try {
            var _data_session;
            // Clear any existing cached data
            this.clearCache();
            // Try to refresh the session
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
            if (error) {
                console.error('❌ AuthManager: Session refresh failed:', error);
                // If refresh fails due to invalid refresh token, try to get a new session
                if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
                    var _sessionData_session;
                    console.log('🔄 AuthManager: Refresh token invalid, attempting re-authentication');
                    // Try to get a new session by calling getSession
                    const { data: sessionData, error: sessionError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    if (sessionError) {
                        console.error('❌ AuthManager: Failed to get new session:', sessionError);
                        return null;
                    }
                    if (sessionData === null || sessionData === void 0 ? void 0 : (_sessionData_session = sessionData.session) === null || _sessionData_session === void 0 ? void 0 : _sessionData_session.access_token) {
                        this.cachedToken = sessionData.session.access_token;
                        this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                        console.log('✅ AuthManager: Got new session after refresh token failure');
                        return sessionData.session.access_token;
                    }
                }
                return null;
            }
            if ((_data_session = data.session) === null || _data_session === void 0 ? void 0 : _data_session.access_token) {
                this.cachedToken = data.session.access_token;
                this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                console.log('✅ AuthManager: Session refreshed successfully');
                return data.session.access_token;
            }
            return null;
        } catch (error) {
            console.error('❌ AuthManager: Error during session refresh:', error);
            return null;
        }
    }
    async fetchAuthToken() {
        try {
            var _session_user, _session_access_token;
            console.log('🔍 AuthManager: Attempting to get session from Supabase...');
            // First, try to get the current session
            const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            console.log('🔍 AuthManager: Session retrieval result:', {
                hasError: !!error,
                errorMessage: error === null || error === void 0 ? void 0 : error.message,
                hasSession: !!session,
                sessionUserId: session === null || session === void 0 ? void 0 : (_session_user = session.user) === null || _session_user === void 0 ? void 0 : _session_user.id,
                hasAccessToken: !!(session === null || session === void 0 ? void 0 : session.access_token),
                accessTokenLength: session === null || session === void 0 ? void 0 : (_session_access_token = session.access_token) === null || _session_access_token === void 0 ? void 0 : _session_access_token.length,
                sessionExpiry: (session === null || session === void 0 ? void 0 : session.expires_at) ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
            });
            if (error) {
                console.error('❌ AuthManager: Error getting session:', error);
                return null;
            }
            if (session === null || session === void 0 ? void 0 : session.access_token) {
                // Cache the token for 10 minutes (increased from 5)
                this.cachedToken = session.access_token;
                this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                console.log('✅ AuthManager: Token cached successfully, tokenLength:', session.access_token.length, 'expiry:', new Date(this.tokenExpiry).toISOString());
                return session.access_token;
            }
            console.log('⚠️ AuthManager: No access token found in session - trying alternative approaches');
            // If no session, try to get the current user to see if we're logged in
            console.log('🔍 AuthManager: Checking current user...');
            const { data: { user }, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            console.log('🔍 AuthManager: Current user check:', {
                hasUser: !!user,
                userId: user === null || user === void 0 ? void 0 : user.id,
                hasUserError: !!userError,
                userErrorMessage: userError === null || userError === void 0 ? void 0 : userError.message
            });
            if (userError) {
                console.error('❌ AuthManager: Error getting user:', userError);
                return null;
            }
            if (user) {
                var _data_session, _data_session1;
                console.log('✅ AuthManager: User is logged in but no session found, trying to refresh...');
                // Try to refresh the session
                const { data, error: refreshError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
                console.log('🔄 AuthManager: Session refresh result:', {
                    hasRefreshError: !!refreshError,
                    refreshErrorMessage: refreshError === null || refreshError === void 0 ? void 0 : refreshError.message,
                    hasRefreshedSession: !!data.session,
                    hasRefreshedToken: !!((_data_session = data.session) === null || _data_session === void 0 ? void 0 : _data_session.access_token)
                });
                if ((_data_session1 = data.session) === null || _data_session1 === void 0 ? void 0 : _data_session1.access_token) {
                    this.cachedToken = data.session.access_token;
                    this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                    console.log('✅ AuthManager: Token refreshed and cached successfully');
                    return data.session.access_token;
                }
            }
            // Last resort: try to read from localStorage directly
            console.log('🔍 AuthManager: Trying to read from localStorage directly...');
            try {
                const keys = Object.keys(localStorage);
                const authKey = keys.find((key)=>key.includes('supabase') && key.includes('auth'));
                if (authKey) {
                    const authData = localStorage.getItem(authKey);
                    if (authData) {
                        var _parsed_currentSession;
                        const parsed = JSON.parse(authData);
                        if (parsed === null || parsed === void 0 ? void 0 : (_parsed_currentSession = parsed.currentSession) === null || _parsed_currentSession === void 0 ? void 0 : _parsed_currentSession.access_token) {
                            console.log('✅ AuthManager: Found token in localStorage!');
                            this.cachedToken = parsed.currentSession.access_token;
                            this.tokenExpiry = Date.now() + 10 * 60 * 1000;
                            return parsed.currentSession.access_token;
                        }
                    }
                }
            } catch (storageError) {
                console.log('🔍 AuthManager: Could not read from localStorage:', storageError);
            }
            console.log('❌ AuthManager: Unable to retrieve auth token from any source');
            return null;
        } catch (error) {
            console.error('❌ AuthManager: Error fetching auth token:', error);
            return null;
        }
    }
    clearCache() {
        console.log('AuthManager: Clearing cache');
        this.cachedToken = null;
        this.tokenExpiry = 0;
        this.tokenPromise = null;
    }
    // Method to handle authentication errors
    async handleAuthError() {
        console.log('Authentication error detected, attempting recovery');
        // First try to refresh the session
        const token = await this.refreshSession();
        if (token) {
            console.log('✅ AuthManager: Recovered from authentication error');
            return token;
        }
        // If refresh fails, clear cache and force re-authentication
        console.log('❌ AuthManager: Could not recover from authentication error, clearing cache');
        this.clearCache();
        return null;
    }
    // Check if we have a valid cached token without triggering a fetch
    hasValidToken() {
        var _this_cachedToken;
        const now = Date.now();
        const hasValid = !!(this.cachedToken && now < this.tokenExpiry);
        console.log('AuthManager: hasValidToken check - hasToken:', !!this.cachedToken, 'tokenLength:', (_this_cachedToken = this.cachedToken) === null || _this_cachedToken === void 0 ? void 0 : _this_cachedToken.length, 'expiry:', new Date(this.tokenExpiry).toISOString(), 'now:', new Date(now).toISOString(), 'isExpired:', now >= this.tokenExpiry, 'result:', hasValid);
        return hasValid;
    }
    // Force refresh the session
    async forceRefreshSession() {
        console.log('AuthManager: Force refreshing session');
        this.clearCache();
        return await this.getAuthToken();
    }
    // Check if user is currently logged in
    async isLoggedIn() {
        // Wait for initialization to complete
        await this.waitForInitialization();
        try {
            console.log('🔐 AuthManager: Checking if user is logged in...');
            const { data: { user }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            const isLoggedIn = !error && !!user;
            console.log('🔐 AuthManager: isLoggedIn check - hasUser:', !!user, 'userId:', user === null || user === void 0 ? void 0 : user.id, 'hasError:', !!error, 'errorMessage:', error === null || error === void 0 ? void 0 : error.message, 'result:', isLoggedIn);
            return isLoggedIn;
        } catch (error) {
            console.error('❌ AuthManager: Error checking login status:', error);
            return false;
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "tokenPromise", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cachedToken", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "tokenExpiry", 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "initialized", false);
        console.log('AuthManager: Constructor called');
        this.initialize();
    }
}
const debugAuth = async ()=>{
    console.log('🔧 DEBUG: Starting comprehensive auth debug...');
    try {
        var _sessionData_session, _sessionData_session1, _sessionData_session_user, _sessionData_session2, _userData_user;
        // Test 1: Check Supabase client
        console.log('🔧 DEBUG: Testing Supabase client...');
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) {
            console.error('❌ DEBUG: Supabase client is null/undefined');
            return {
                error: 'No Supabase client'
            };
        }
        console.log('✅ DEBUG: Supabase client exists');
        // Test 2: Check current session
        console.log('🔧 DEBUG: Testing current session...');
        const { data: sessionData, error: sessionError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        console.log('🔧 DEBUG: Session data:', {
            hasSession: !!(sessionData === null || sessionData === void 0 ? void 0 : sessionData.session),
            hasAccessToken: !!(sessionData === null || sessionData === void 0 ? void 0 : (_sessionData_session = sessionData.session) === null || _sessionData_session === void 0 ? void 0 : _sessionData_session.access_token),
            sessionError: sessionError === null || sessionError === void 0 ? void 0 : sessionError.message,
            sessionExpiry: (sessionData === null || sessionData === void 0 ? void 0 : (_sessionData_session1 = sessionData.session) === null || _sessionData_session1 === void 0 ? void 0 : _sessionData_session1.expires_at) ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'N/A',
            sessionUserId: sessionData === null || sessionData === void 0 ? void 0 : (_sessionData_session2 = sessionData.session) === null || _sessionData_session2 === void 0 ? void 0 : (_sessionData_session_user = _sessionData_session2.user) === null || _sessionData_session_user === void 0 ? void 0 : _sessionData_session_user.id
        });
        // Test 3: Check current user
        console.log('🔧 DEBUG: Testing current user...');
        const { data: userData, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
        console.log('🔧 DEBUG: User data:', {
            hasUser: !!(userData === null || userData === void 0 ? void 0 : userData.user),
            userId: userData === null || userData === void 0 ? void 0 : (_userData_user = userData.user) === null || _userData_user === void 0 ? void 0 : _userData_user.id,
            userError: userError === null || userError === void 0 ? void 0 : userError.message
        });
        // Test 4: Test AuthManager directly
        console.log('🔧 DEBUG: Testing AuthManager...');
        const authManager = new AuthManager();
        const token = await authManager.getAuthToken();
        console.log('🔧 DEBUG: AuthManager token result:', {
            hasToken: !!token,
            tokenLength: token === null || token === void 0 ? void 0 : token.length,
            tokenStart: (token === null || token === void 0 ? void 0 : token.substring(0, 20)) + '...'
        });
        // Test 5: Check browser storage
        console.log('🔧 DEBUG: Checking browser storage...');
        try {
            const localStorageKeys = Object.keys(localStorage).filter((key)=>key.includes('supabase'));
            console.log('🔧 DEBUG: Supabase localStorage keys:', localStorageKeys);
            // Try to read actual Supabase auth data
            const authKey = localStorageKeys.find((key)=>key.includes('auth'));
            if (authKey) {
                const authData = localStorage.getItem(authKey);
                console.log('🔧 DEBUG: Auth data exists in localStorage:', !!authData);
                if (authData) {
                    var _parsed_currentSession, _parsed_currentSession1;
                    const parsed = JSON.parse(authData);
                    console.log('🔧 DEBUG: Parsed auth data:', {
                        hasCurrentSession: !!(parsed === null || parsed === void 0 ? void 0 : parsed.currentSession),
                        hasAccessToken: !!(parsed === null || parsed === void 0 ? void 0 : (_parsed_currentSession = parsed.currentSession) === null || _parsed_currentSession === void 0 ? void 0 : _parsed_currentSession.access_token),
                        sessionExpiry: (parsed === null || parsed === void 0 ? void 0 : (_parsed_currentSession1 = parsed.currentSession) === null || _parsed_currentSession1 === void 0 ? void 0 : _parsed_currentSession1.expires_at) ? new Date(parsed.currentSession.expires_at * 1000).toISOString() : 'N/A'
                    });
                }
            }
            const sessionStorageKeys = Object.keys(sessionStorage).filter((key)=>key.includes('supabase'));
            console.log('🔧 DEBUG: Supabase sessionStorage keys:', sessionStorageKeys);
        } catch (e) {
            console.log('🔧 DEBUG: Could not access browser storage:', e);
        }
        const result = {
            supabaseOk: !!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"],
            sessionOk: !!(sessionData === null || sessionData === void 0 ? void 0 : sessionData.session),
            userOk: !!(userData === null || userData === void 0 ? void 0 : userData.user),
            tokenOk: !!token,
            sessionData,
            userData,
            hasToken: !!token
        };
        console.log('🔧 DEBUG: Final result:', result);
        return result;
    } catch (error) {
        console.error('❌ DEBUG: Auth debug failed:', error);
        return {
            error: error.message
        };
    }
};
const authManager = new AuthManager();
const testAuthFixes = async ()=>{
    console.log('🔧 Testing authentication fixes...');
    try {
        // Test 1: Check if auth manager can get token
        console.log('🔧 Test 1: Getting auth token...');
        const token = await authManager.getAuthToken();
        console.log('🔧 Test 1 Result:', {
            hasToken: !!token,
            tokenLength: token === null || token === void 0 ? void 0 : token.length
        });
        // Test 2: Check session refresh
        console.log('🔧 Test 2: Testing session refresh...');
        const refreshToken = await authManager.refreshSession();
        console.log('🔧 Test 2 Result:', {
            hasRefreshToken: !!refreshToken,
            tokenLength: refreshToken === null || refreshToken === void 0 ? void 0 : refreshToken.length
        });
        // Test 3: Test error handling
        console.log('🔧 Test 3: Testing error handling...');
        const errorResult = await authManager.handleAuthError();
        console.log('🔧 Test 3 Result:', {
            recovered: !!errorResult,
            tokenLength: errorResult === null || errorResult === void 0 ? void 0 : errorResult.length
        });
        console.log('✅ Authentication fixes test completed');
        return {
            success: true,
            token,
            refreshToken,
            errorResult
        };
    } catch (error) {
        console.error('❌ Authentication fixes test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "_": ()=>_define_property
});
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
;
}),
}]);

//# sourceMappingURL=_44d4353a._.js.map