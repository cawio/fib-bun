import { serve } from 'bun';

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

// Enhanced caching for all computationally intensive operations
const fibCache = new Map<number, number>();
const primeCache = new Map<number, number>();
const factorialCache = new Map<number, number>();
const piCache = new Map<number, string>();

// Rate limiting
const rateLimits = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 200;      // Max 200 requests per minute per IP

// Improved iterative Fibonacci implementation (much faster than recursive)
function fibonacci(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (fibCache.has(n)) return fibCache.get(n)!;

    let a = 0,
        b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;

        // Cache intermediate results periodically
        if (i % 10 === 0) {
            fibCache.set(i, b);
        }
    }

    fibCache.set(n, b);
    return b;
}

// Prime number calculation using Sieve of Eratosthenes for efficiency
const MAX_PRIME_CACHE = 10000;
const primeSieve = new Array<boolean>(MAX_PRIME_CACHE).fill(true);
const primesList: number[] = [];

// Initialize the prime sieve on startup
function initPrimeSieve() {
    primeSieve[0] = primeSieve[1] = false;

    for (let i = 2; i * i < MAX_PRIME_CACHE; i++) {
        if (primeSieve[i]) {
            for (let j = i * i; j < MAX_PRIME_CACHE; j += i) {
                primeSieve[j] = false;
            }
        }
    }

    // Fill the primes list
    for (let i = 2; i < MAX_PRIME_CACHE; i++) {
        if (primeSieve[i]) primesList.push(i);
    }

    // Cache the nth prime positions
    for (let i = 0; i < primesList.length; i++) {
        primeCache.set(i + 1, primesList[i]!);
    }
}

// Initialize prime sieve immediately
initPrimeSieve();

function nthPrime(n: number): number {
    // Return from cache if available
    if (primeCache.has(n)) return primeCache.get(n)!;

    // If n is beyond our sieve, use a more efficient approach
    if (n > primesList.length) {
        let count = primesList.length;
        let num = primesList[primesList.length - 1]!;

        while (count < n) {
            num += 2; // Check only odd numbers
            let isPrime = true;

            // Check divisibility by primes up to sqrt(num)
            for (const prime of primesList) {
                if (prime * prime > num) break;
                if (num % prime === 0) {
                    isPrime = false;
                    break;
                }
            }

            if (isPrime) {
                count++;
                if (count === n) {
                    primeCache.set(n, num);
                    return num;
                }
            }
        }
    }

    return -1; // Should not happen if sieve is large enough
}

// Improved iterative factorial with caching
function factorial(n: number): number {
    if (n <= 1) return 1;
    if (factorialCache.has(n)) return factorialCache.get(n)!;

    // Use previous cached value if available
    let result = 1;
    let start = 1;

    // Find the largest cached factorial less than n
    for (let i = n - 1; i >= 1; i--) {
        if (factorialCache.has(i)) {
            result = factorialCache.get(i)!;
            start = i + 1;
            break;
        }
    }

    for (let i = start; i <= n; i++) {
        result *= i;
        // Cache periodically
        if (i % 5 === 0 || i === n) {
            factorialCache.set(i, result);
        }
    }

    return result;
}

// More efficient Pi calculation
function computePi(digits: number): string {
    if (piCache.has(digits)) return piCache.get(digits)!;

    // Better approximation using Machin-like formula
    // Much faster convergence than Leibniz
    const iterations = Math.min(10000, digits * 8);
    let pi = 4 * (4 * arctangent(1 / 5, iterations) - arctangent(1 / 239, iterations));

    const result = pi.toFixed(digits);
    piCache.set(digits, result);
    return result;
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

// Generate random bytes with enforced size limit
function generateRandomBytes(size: number): string {
    // Limit size to prevent excessive memory usage
    const actualSize = Math.min(size, 5000);
    const buffer = new Uint8Array(actualSize);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer).toString('hex');
}

// Generate and sort random array with a size limit
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

const server = serve({
    port: 3000,
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // Apply rate limiting
        if (!checkRateLimit(ip)) {
            return errorResponse('Rate limit exceeded', 429);
        }

        if (url.pathname.startsWith('/fibonacci/')) {
            const n = Number(url.pathname.split('/fibonacci/')[1]);
            if (isNaN(n) || n < 0 || n > 1000) return errorResponse('Invalid Fibonacci input (max 1000)');

            return successResponse({ n, fibonacci: fibonacci(n) } as FibonacciResponse);
        }

        if (url.pathname.startsWith('/prime/')) {
            const n = Number(url.pathname.split('/prime/')[1]);
            if (isNaN(n) || n <= 0 || n > 10000) return errorResponse('Invalid prime input (max 10000)');

            return successResponse({ n, prime: nthPrime(n) } as PrimeResponse);
        }

        if (url.pathname.startsWith('/factorial/')) {
            const n = Number(url.pathname.split('/factorial/')[1]);
            if (isNaN(n) || n < 0 || n > 170) return errorResponse('Invalid factorial input (max 170)');

            return successResponse({ n, factorial: factorial(n) } as FactorialResponse);
        }

        if (url.pathname.startsWith('/pi/')) {
            const digits = Number(url.pathname.split('/pi/')[1]);
            if (isNaN(digits) || digits < 1 || digits > 50) return errorResponse('Invalid Pi digit input (max 50)');

            return successResponse({ digits, pi: computePi(digits) } as PiResponse);
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