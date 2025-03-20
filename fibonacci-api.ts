import { serve } from 'bun';
import { createClient } from 'redis';

interface FibonacciResponse {
    n: number;
    fibonacci: number;
}

interface PrimeResponse {
    n: number;
    prime: number;
}

interface FactorialResponse {
    n: number;
    factorial: number;
}

interface PiResponse {
    digits: number;
    pi: string;
}

interface RandomBytesResponse {
    size: number;
    data: string;
}

interface SortResponse {
    size: number;
    sorted: number[];
}

interface ErrorResponse {
    error: string;
}

// Fallback caches in case Redis is unavailable
const fibCache = new Map<number, string>();
const primeCache = new Map<number, string>();
const factorialCache = new Map<number, string>();
const piCache = new Map<number, string>();

// Rate limiting using local memory (could be moved to Redis in production)
const rateLimits = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 200; // Max 200 requests per minute per IP

// Redis client
// REPLACE WITH YOUR ACTUAL REDIS CONNECTION DETAILS
const redisConnectionString = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Connecting to Redis at ${redisConnectionString}`);
const redisClient = createClient({
    url: redisConnectionString,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
});

// Redis key prefixes for different calculations
const REDIS_KEYS = {
    FIBONACCI: 'fib:',
    PRIME: 'prime:',
    FACTORIAL: 'fact:',
    PI: 'pi:',
    HEALTHCHECK: 'health:',
};

// Default TTL for Redis cache entries (1 week in seconds)
const DEFAULT_TTL = 604800;

// Initialize Redis connection
async function initRedis() {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis');

        // Set a health check key
        await redisClient.set(REDIS_KEYS.HEALTHCHECK + 'startup', Date.now().toString());

        // Precompute and cache some common values
        precomputeValues();
    } catch (err) {
        console.error('❌ Redis connection failed:', err);
        console.log('⚠️ Running in fallback mode with in-memory caching only');
    }
}

// Precompute common values and store in Redis
async function precomputeValues() {
    try {
        // Precompute first 100 Fibonacci numbers
        for (let i = 0; i <= 100; i += 10) {
            await cacheValue(REDIS_KEYS.FIBONACCI + i, fibonacci(i).toString());
        }

        // Precompute first 100 primes
        const primes = await computeInitialPrimes(100);
        for (let i = 1; i <= 100; i++) {
            if (primes[i - 1]) {
                await cacheValue(REDIS_KEYS.PRIME + i, primes[i - 1]!.toString());
            }
        }

        // Precompute factorials up to 20
        for (let i = 1; i <= 20; i++) {
            await cacheValue(REDIS_KEYS.FACTORIAL + i, factorial(i).toString());
        }

        // Precompute Pi to various digits
        for (let digits of [10, 20, 50]) {
            await cacheValue(REDIS_KEYS.PI + digits, computePi(digits));
        }

        console.log('✅ Precomputed common values cached in Redis');
    } catch (err) {
        console.error('⚠️ Error precomputing values:', err);
    }
}

// Helper to retrieve cached value from Redis or fallback cache
async function getCachedValue(key: string, fallbackCache?: Map<number, string>): Promise<string | null> {
    try {
        if (redisClient.isOpen) {
            const value = await redisClient.get(key);
            return value;
        }
    } catch (error) {
        console.error(`Redis error when getting ${key}:`, error);
    }

    // Fallback to in-memory cache if Redis fails
    if (fallbackCache) {
        const numericKey = parseInt(key.split(':')[1]!);
        return fallbackCache.get(numericKey) || null;
    }

    return null;
}

// Helper to cache value in Redis and fallback cache
async function cacheValue(key: string, value: string, fallbackCache?: Map<number, any>, ttl = DEFAULT_TTL): Promise<void> {
    try {
        if (redisClient.isOpen) {
            await redisClient.set(key, value, { EX: ttl });
        }
    } catch (error) {
        console.error(`Redis error when setting ${key}:`, error);
    }

    // Always update local cache as fallback
    if (fallbackCache) {
        const numericKey = parseInt(key.split(':')[1]!);
        fallbackCache.set(numericKey, value);
    }
}

// Improved iterative Fibonacci implementation with Redis caching
async function fibonacciWithCache(n: number): Promise<string> {
    if (n <= 0) return '0';
    if (n === 1) return '1';

    const cacheKey = REDIS_KEYS.FIBONACCI + n;
    const cachedValue = await getCachedValue(cacheKey, fibCache);

    if (cachedValue !== null) {
        return cachedValue;
    }

    // Use BigInt for larger numbers to avoid precision issues
    let a = BigInt(0);
    let b = BigInt(1);

    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;

        // Cache intermediate results periodically
        if (i % 10 === 0 || i === n) {
            await cacheValue(REDIS_KEYS.FIBONACCI + i, b.toString(), fibCache);
        }
    }

    return b.toString();
}

// Synchronous Fibonacci for initial loading
function fibonacci(n: number): bigint {
    if (n <= 0) return BigInt(0);
    if (n === 1) return BigInt(1);

    let a = BigInt(0);
    let b = BigInt(1);

    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
    }

    return b;
}

// Prime number calculations with Redis caching
async function computeInitialPrimes(maxN: number): Promise<number[]> {
    const primes: number[] = [];
    const sieve = new Array<boolean>(maxN * 20).fill(true);
    sieve[0] = sieve[1] = false;

    for (let i = 2; primes.length < maxN && i < sieve.length; i++) {
        if (sieve[i]) {
            primes.push(i);

            // Mark all multiples as non-prime
            for (let j = i * i; j < sieve.length; j += i) {
                sieve[j] = false;
            }
        }
    }

    return primes;
}

async function nthPrimeWithCache(n: number): Promise<string> {
    if (n <= 0) return '0';

    const cacheKey = REDIS_KEYS.PRIME + n;
    const cachedValue = await getCachedValue(cacheKey, primeCache);

    if (cachedValue !== null) {
        return cachedValue;
    }

    // Compute using sieve for efficiency
    const primes = await computeInitialPrimes(Math.max(n, 100));

    if (n <= primes.length) {
        const result = primes[n - 1]!.toString();
        await cacheValue(cacheKey, result, primeCache);
        return result;
    }

    // For very large n, use a different approach
    // This is a fallback but should rarely be needed
    return '0'; // Should be replaced with actual computation
}

// Factorial with Redis caching
async function factorialWithCache(n: number): Promise<string> {
    if (n <= 1) return '1';

    const cacheKey = REDIS_KEYS.FACTORIAL + n;
    const cachedValue = await getCachedValue(cacheKey, factorialCache);

    if (cachedValue !== null) {
        return cachedValue;
    }

    // Find largest cached factorial less than n
    let result = BigInt(1);
    let start = 1;

    for (let i = n - 1; i >= 1; i--) {
        const prevCacheKey = REDIS_KEYS.FACTORIAL + i;
        const prevCached = await getCachedValue(prevCacheKey);

        if (prevCached !== null) {
            result = BigInt(prevCached);
            start = i + 1;
            break;
        }
    }

    // Calculate remaining part
    for (let i = start; i <= n; i++) {
        result *= BigInt(i);

        // Cache intermediate results
        if (i % 5 === 0 || i === n) {
            await cacheValue(REDIS_KEYS.FACTORIAL + i, result.toString(), factorialCache);
        }
    }

    return result.toString();
}

// Synchronous factorial for initial loading
function factorial(n: number): bigint {
    if (n <= 1) return BigInt(1);

    let result = BigInt(1);
    for (let i = 2; i <= n; i++) {
        result *= BigInt(i);
    }

    return result;
}

// Pi calculation with Redis caching
async function piWithCache(digits: number): Promise<string> {
    const cacheKey = REDIS_KEYS.PI + digits;
    const cachedValue = await getCachedValue(cacheKey, piCache);

    if (cachedValue !== null) {
        return cachedValue;
    }

    // Compute pi using a faster algorithm
    const result = computePi(digits);
    await cacheValue(cacheKey, result, piCache);

    return result;
}

// More efficient Pi calculation (Chudnovsky algorithm approximation)
function computePi(digits: number): string {
    // For simplicity, we use a modified Machin-like formula
    // In production, consider a more sophisticated implementation like Chudnovsky
    const iterations = Math.min(10000, digits * 10);
    let pi = 4 * (4 * arctangent(1 / 5, iterations) - arctangent(1 / 239, iterations));

    return pi.toFixed(digits);
}

// Helper for Pi calculation
function arctangent(x: number, iterations: number): number {
    let sum = 0;
    let term = x;
    let sign = 1;

    for (let i = 0; i < iterations; i++) {
        sum += (sign * term) / (2 * i + 1);
        term *= x * x;
        sign *= -1;
    }

    return sum;
}

// Generate random bytes
function generateRandomBytes(size: number): string {
    // Limit size to prevent excessive memory usage
    const actualSize = Math.min(size, 5000);
    const buffer = new Uint8Array(actualSize);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer).toString('hex');
}

// Generate and sort random array
function generateAndSortArray(size: number): number[] {
    // Limit size to prevent excessive memory usage
    const actualSize = Math.min(size, 5000);
    const arr = Array.from({ length: actualSize }, () => Math.random());
    return arr.sort((a, b) => a - b);
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimits.get(ip) || { count: 0, timestamp: now };

    // Reset if outside window
    if (now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimits.set(ip, { count: 1, timestamp: now });
        return true;
    }

    // Increment and check
    record.count++;
    rateLimits.set(ip, record);

    return record.count <= RATE_LIMIT_MAX;
}

// Clean up rate limiting data periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimits.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            rateLimits.delete(ip);
        }
    }
}, 60000);

// Health endpoint for container health checks
async function healthCheck(): Promise<object> {
    let redisStatus = 'disconnected';

    try {
        if (redisClient.isOpen) {
            const pingResult = await redisClient.ping();
            redisStatus = pingResult === 'PONG' ? 'connected' : 'error';
        }
    } catch (err) {
        redisStatus = 'error';
    }

    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        redis: redisStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
    };
}

// Initialize Redis on startup
initRedis();

const server = serve({
    port: 3000,
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // Health check endpoint
        if (url.pathname === '/health') {
            return successResponse(await healthCheck());
        }

        // Apply rate limiting
        if (!checkRateLimit(ip)) {
            return errorResponse('Rate limit exceeded', 429);
        }

        try {
            if (url.pathname.startsWith('/fibonacci/')) {
                const n = Number(url.pathname.split('/fibonacci/')[1]);
                if (isNaN(n) || n < 0 || n > 1000) return errorResponse('Invalid Fibonacci input (max 1000)');

                const result = await fibonacciWithCache(n);
                return successResponse({ n, fibonacci: result } as unknown as FibonacciResponse);
            }

            if (url.pathname.startsWith('/prime/')) {
                const n = Number(url.pathname.split('/prime/')[1]);
                if (isNaN(n) || n <= 0 || n > 10000) return errorResponse('Invalid prime input (max 10000)');

                const result = await nthPrimeWithCache(n);
                return successResponse({ n, prime: result } as unknown as PrimeResponse);
            }

            if (url.pathname.startsWith('/factorial/')) {
                const n = Number(url.pathname.split('/factorial/')[1]);
                if (isNaN(n) || n < 0 || n > 170) return errorResponse('Invalid factorial input (max 170)');

                const result = await factorialWithCache(n);
                return successResponse({ n, factorial: result } as unknown as FactorialResponse);
            }

            if (url.pathname.startsWith('/pi/')) {
                const digits = Number(url.pathname.split('/pi/')[1]);
                if (isNaN(digits) || digits < 1 || digits > 50) return errorResponse('Invalid Pi digit input (max 50)');

                const result = await piWithCache(digits);
                return successResponse({ digits, pi: result } as PiResponse);
            }

            if (url.pathname.startsWith('/random-bytes/')) {
                const size = Number(url.pathname.split('/random-bytes/')[1]);
                if (isNaN(size) || size < 1 || size > 5000) return errorResponse('Invalid byte size (max 5000)');

                return successResponse({ size, data: generateRandomBytes(size) } as RandomBytesResponse);
            }

            if (url.pathname.startsWith('/sort/')) {
                const size = Number(url.pathname.split('/sort/')[1]);
                if (isNaN(size) || size < 1 || size > 5000) return errorResponse('Invalid sort size (max 5000)');

                return successResponse({ size, sorted: generateAndSortArray(size) } as SortResponse);
            }

            return errorResponse('Not found', 404);
        } catch (error) {
            console.error('Error processing request:', error);
            return errorResponse('Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
        }
    },
});

function successResponse(data: object): Response {
    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60', // Enable caching for 60 seconds
        },
    });
}

function errorResponse(message: string, status = 400): Response {
    return new Response(JSON.stringify({ error: message } as ErrorResponse), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

console.log(`API running at http://localhost:3000`);