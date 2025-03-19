import requests
import concurrent.futures
import time
import random

BASE_URL = "http://localhost:3000"
NUM_REQUESTS = 100

ENDPOINTS = [
    "/fibonacci/{n}",
    "/prime/{n}",
    "/factorial/{n}",
    "/pi/{n}",
    "/random-bytes/{n}",
    "/sort/{n}",
]

def stress_test():
    def request_random_endpoint():
        endpoint = random.choice(ENDPOINTS)
        n = random.randint(10, 500)
        url = BASE_URL + endpoint.format(n=n)

        start_time = time.time()
        try:
            response = requests.get(url, timeout=5)
            elapsed_time = time.time() - start_time
            return f"✔ {url} - {elapsed_time:.2f}s" if response.status_code == 200 else f"✖ {url} - {response.status_code}"
        except requests.exceptions.RequestException as e:
            return f"✖ {url} - Error: {e}"

    try:
        while True:
            with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_REQUESTS) as executor:
                results = list(executor.map(lambda _: request_random_endpoint(), range(NUM_REQUESTS)))

            for result in results:
                print(result)

    except KeyboardInterrupt:
        print("\n💀 Stopping stress test...")
        exit(0)

if __name__ == "__main__":
    print("🚀 Starting Continuous API Stress Test...\n")
    stress_test()
