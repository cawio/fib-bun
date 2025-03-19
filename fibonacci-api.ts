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

const fibCache = new Map<number, number>();

function fibonacci(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (fibCache.has(n)) return fibCache.get(n)!;

    const result = fibonacci(n - 1) + fibonacci(n - 2);
    fibCache.set(n, result);
    return result;
}

// Compute nth prime (Brute-force)
function nthPrime(n: number): number {
    let count = 0,
        num = 1;
    while (count < n) {
        num++;
        if (isPrime(num)) count++;
    }
    return num;
}

function isPrime(num: number): boolean {
    if (num < 2) return false;
    for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Compute factorial
function factorial(n: number): number {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Compute Pi to n digits using Leibniz formula
function computePi(digits: number): string {
    let pi = 0;
    for (let k = 0; k < digits * 100; k++) {
        pi += (4 * Math.pow(-1, k)) / (2 * k + 1);
    }
    return pi.toFixed(digits);
}

// Generate random bytes
function generateRandomBytes(size: number): string {
    const buffer = new Uint8Array(size);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer).toString('hex');
}

// Generate and sort random array
function generateAndSortArray(size: number): number[] {
    const arr = Array.from({ length: size }, () => Math.random());
    return arr.sort((a, b) => a - b);
}

const server = serve({
    port: 3000,
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);

        if (url.pathname.startsWith('/fibonacci/')) {
            const n = Number(url.pathname.split('/fibonacci/')[1]);
            if (isNaN(n) || n < 0) return errorResponse('Invalid Fibonacci input');

            return successResponse({ n, fibonacci: fibonacci(n) } as FibonacciResponse);
        }

        if (url.pathname.startsWith('/prime/')) {
            const n = Number(url.pathname.split('/prime/')[1]);
            if (isNaN(n) || n <= 0) return errorResponse('Invalid prime input');

            return successResponse({ n, prime: nthPrime(n) } as PrimeResponse);
        }

        if (url.pathname.startsWith('/factorial/')) {
            const n = Number(url.pathname.split('/factorial/')[1]);
            if (isNaN(n) || n < 0 || n > 170) return errorResponse('Invalid factorial input');

            return successResponse({ n, factorial: factorial(n) } as FactorialResponse);
        }

        if (url.pathname.startsWith('/pi/')) {
            const digits = Number(url.pathname.split('/pi/')[1]);
            if (isNaN(digits) || digits < 1 || digits > 100) return errorResponse('Invalid Pi digit input');

            return successResponse({ digits, pi: computePi(digits) } as PiResponse);
        }

        if (url.pathname.startsWith('/random-bytes/')) {
            const size = Number(url.pathname.split('/random-bytes/')[1]);
            if (isNaN(size) || size < 1 || size > 1000000) return errorResponse('Invalid byte size');

            return successResponse({ size, data: generateRandomBytes(size) } as RandomBytesResponse);
        }

        if (url.pathname.startsWith('/sort/')) {
            const size = Number(url.pathname.split('/sort/')[1]);
            if (isNaN(size) || size < 1 || size > 1000000) return errorResponse('Invalid sort size');

            return successResponse({ size, sorted: generateAndSortArray(size) } as SortResponse);
        }

        return errorResponse('Not found', 404);
    },
});

function successResponse(data: object): Response {
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}

function errorResponse(message: string, status = 400): Response {
    return new Response(JSON.stringify({ error: message } as ErrorResponse), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

console.log(`API running at http://localhost:3000`);
