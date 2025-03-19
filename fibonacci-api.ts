import { serve } from 'bun';

interface FibonacciResponse {
    n: number;
    fibonacci: number;
}

interface SequenceResponse {
    result: number[];
    length: number;
}

interface ErrorResponse {
    error: string;
}

const fibCache = new Map<number, number>();

function fibonacci(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;

    if (fibCache.has(n)) {
        return fibCache.get(n)!;
    }

    const result = fibonacci(n - 1) + fibonacci(n - 2);
    fibCache.set(n, result);
    return result;
}

const server = serve({
    port: 3000,
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);

        if (url.pathname === '/') {
            return new Response(
                'Fibonacci API\n\nUsage:\n/fibonacci/:n - Get the nth Fibonacci number\n/fibonacci/sequence/:n - Get Fibonacci sequence up to n',
                { headers: { 'Content-Type': 'text/plain' } }
            );
        }

        if (url.pathname.startsWith('/fibonacci/')) {
            let param = url.pathname.split('/fibonacci/')[1];

            if (param && param.startsWith('sequence/')) {
                const n = Number(param.split('sequence/')[1]);

                if (isNaN(n) || n < 0) {
                    return new Response(JSON.stringify({ error: 'Invalid input. Please provide a non-negative integer.' } as ErrorResponse), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const sequence: number[] = Array.from({ length: n + 1 }, (_, i) => fibonacci(i));

                return new Response(
                    JSON.stringify({
                        result: sequence,
                        length: sequence.length,
                    } as SequenceResponse),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                const n = Number(param);

                if (isNaN(n) || n < 0) {
                    return new Response(JSON.stringify({ error: 'Invalid input. Please provide a non-negative integer.' } as ErrorResponse), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                try {
                    const result = fibonacci(n);

                    return new Response(
                        JSON.stringify({
                            n: n,
                            fibonacci: result,
                        } as FibonacciResponse),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                } catch (error) {
                    return new Response(JSON.stringify({ error: 'Computation failed. Input might be too large.' } as ErrorResponse), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            }
        }

        return new Response(JSON.stringify({ error: 'Not found' } as ErrorResponse), { status: 404, headers: { 'Content-Type': 'application/json' } });
    },
});

console.log(`Fibonacci API server running at http://localhost:${server.port}`);
