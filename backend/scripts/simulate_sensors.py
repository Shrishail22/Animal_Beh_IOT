"""
Synthetic IoT sensor simulator.

Sends simulated animal sensor readings to the FastAPI backend.
These values are for software testing, not real animal diagnosis.
"""

import argparse
import random
import time
from datetime import datetime

import requests


def generate_reading():
    """Generate one synthetic sensor reading."""

    # Choose a synthetic activity pattern for pipeline testing.
    pattern = random.choice(["active", "resting", "active", "resting"])

    if pattern == "active":
        movement = round(random.uniform(5.0, 25.0), 4)
        activity_duration = random.randint(10, 30)
        rest_duration = random.randint(0, 5)
        activity_frequency = random.randint(8, 25)
    else:
        movement = round(random.uniform(0.0, 4.0), 4)
        activity_duration = random.randint(0, 5)
        rest_duration = random.randint(10, 30)
        activity_frequency = random.randint(0, 5)

    # Synthetic values only; not calibrated to a real sensor.
    temperature = round(random.uniform(37.0, 39.5), 2)

    return {
        "movement": movement,
        "temperature": temperature,
        "activity_duration": activity_duration,
        "rest_duration": rest_duration,
        "activity_frequency": activity_frequency,
        "recorded_at": datetime.now().isoformat(timespec="seconds"),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Simulate IoT readings for animal monitoring"
    )
    parser.add_argument(
        "--device-id",
        type=int,
        required=True,
        help="Existing device ID from the devices table",
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="FastAPI server base URL",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Seconds between readings",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of readings; use 0 to run until stopped",
    )
    args = parser.parse_args()

    if args.interval <= 0:
        parser.error("--interval must be greater than zero")

    if args.count < 0:
        parser.error("--count cannot be negative")

    endpoint = args.base_url.rstrip("/") + "/api/sensor-readings/"

    print("Animal IoT Sensor Simulator")
    print("Device ID:", args.device_id)
    print("Endpoint:", endpoint)
    print("Interval:", args.interval, "seconds")
    print("Readings:", "continuous" if args.count == 0 else args.count)
    print("Press Ctrl+C to stop.\n")

    sent = 0

    try:
        while args.count == 0 or sent < args.count:
            reading = generate_reading()
            payload = {"device_id": args.device_id, **reading}

            try:
                response = requests.post(
                    endpoint,
                    json=payload,
                    timeout=10,
                )

                if response.status_code == 201:
                    result = response.json()
                    sent += 1
                    print(
                        f"[{sent}] Saved reading ID={result.get('id')} "
                        f"| movement={reading['movement']} "
                        f"| temperature={reading['temperature']} "
                        f"| activity={reading['activity_duration']} "
                        f"| rest={reading['rest_duration']}"
                    )
                else:
                    print(
                        "API error:",
                        response.status_code,
                        response.text,
                    )
                    print("Stopping to avoid repeatedly submitting bad data.")
                    break

            except requests.RequestException as exc:
                print("Connection error:", exc)
                print("Check that FastAPI is running, then restart the simulator.")
                break

            if args.count == 0 or sent < args.count:
                time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")

    print("Successful readings sent:", sent)


if __name__ == "__main__":
    main()
