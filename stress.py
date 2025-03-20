import requests
import concurrent.futures
import time
import random
import statistics
from collections import defaultdict

BASE_URL = "https://fibbun.notacow.dev"
NUM_REQUESTS = 100
MAX_WORKERS = 50  # Limit concurrent connections to avoid overwhelming the server
ENDPOINTS = [
    "/fibonacci/{n}",
    "/prime/{n}",
    "/factorial/{n}",
    "/pi/{n}",
    "/random-bytes/{n}",
    "/sort/{n}",
]

# Define reasonable input ranges for each endpoint
N_RANGES = {
    "/fibonacci/{n}": (1, 200),
    "/prime/{n}": (1, 500),
    "/factorial/{n}": (1, 50),
    "/pi/{n}": (1, 20),
    "/random-bytes/{n}": (1, 1000),
    "/sort/{n}": (1, 1000),
}

def request_random_endpoint():
    endpoint = random.choice(ENDPOINTS)
    n_min, n_max = N_RANGES.get(endpoint, (1, 100))
    n = random.randint(n_min, n_max)

    url = BASE_URL + endpoint.format(n=n)
    start_time = time.time()
    try:
        response = requests.get(url, timeout=10)
        elapsed_time = time.time() - start_time
        return {
            "url": url,
            "endpoint": endpoint,
            "status": response.status_code,
            "time": elapsed_time,
            "success": response.status_code == 200
        }
    except requests.exceptions.RequestException as e:
        return {
            "url": url,
            "endpoint": endpoint,
            "status": "Error",
            "time": time.time() - start_time,
            "error": str(e),
            "success": False
        }

def stress_test(batch_size=NUM_REQUESTS, iterations=100, delay=1):
    all_times = []
    success_count = 0
    total_count = 0
    endpoint_stats = defaultdict(list)

    print(f"🚀 Starting API Stress Test with {batch_size} requests per batch, {iterations} iterations")
    print(f"Using max {MAX_WORKERS} concurrent workers\n")

    for i in range(iterations):
        print(f"\n--- Batch {i+1}/{iterations} ---")
        batch_start = time.time()

        # Process in smaller chunks to avoid overwhelming the server
        results = []
        for j in range(0, batch_size, MAX_WORKERS):
            chunk_size = min(MAX_WORKERS, batch_size - j)
            with concurrent.futures.ThreadPoolExecutor(max_workers=chunk_size) as executor:
                chunk_results = list(executor.map(lambda _: request_random_endpoint(), range(chunk_size)))
                results.extend(chunk_results)
                # Small pause between chunks
                if j + chunk_size < batch_size:
                    time.sleep(0.5)

        batch_time = time.time() - batch_start
        batch_times = [r["time"] for r in results]
        batch_success = sum(1 for r in results if r["success"])

        # Collect statistics
        all_times.extend(batch_times)
        success_count += batch_success
        total_count += len(results)

        # Collect per-endpoint statistics
        for result in results:
            endpoint_stats[result["endpoint"]].append(result["time"])

        # Print batch results
        print(f"Batch completed in {batch_time:.2f}s")
        print(f"Success rate: {batch_success}/{len(results)} ({batch_success/len(results)*100:.1f}%)")
        if batch_times:
            print(f"Response times: min={min(batch_times):.3f}s, max={max(batch_times):.3f}s, avg={sum(batch_times)/len(batch_times):.3f}s")

        # Print slowest results
        print("\nSlowest responses:")
        for i, result in enumerate(sorted(results, key=lambda r: r["time"], reverse=True)[:5]):
            if result["success"]:
                print(f"  ✓ {result['url']} - {result['time']:.3f}s")
            else:
                print(f"  ✗ {result['url']} - {result.get('error', result['status'])}")

        if i < iterations - 1:
            print(f"\nWaiting {delay}s before next batch...")
            time.sleep(delay)

    # Print overall statistics
    print("\n=== Overall Results ===")
    print(f"Total requests: {total_count}")
    print(f"Success rate: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")

    if all_times:
        print(f"\nOverall Response Times:")
        print(f"  Min: {min(all_times):.3f}s")
        print(f"  Max: {max(all_times):.3f}s")
        print(f"  Avg: {sum(all_times)/len(all_times):.3f}s")
        print(f"  Median: {statistics.median(all_times):.3f}s")
        print(f"  95th percentile: {sorted(all_times)[int(len(all_times)*0.95)]:.3f}s")

    # Print per-endpoint statistics
    print("\nEndpoint Performance:")
    for endpoint, times in endpoint_stats.items():
        if times:
            avg_time = sum(times) / len(times)
            max_time = max(times)
            success_rate = sum(1 for t in times if t < 10) / len(times) * 100
            print(f"  {endpoint}: avg={avg_time:.3f}s, max={max_time:.3f}s, success={success_rate:.1f}%")

if __name__ == "__main__":
    try:
        stress_test()
    except KeyboardInterrupt:
        print("\n💀 Stopping stress test...")
        exit(0)