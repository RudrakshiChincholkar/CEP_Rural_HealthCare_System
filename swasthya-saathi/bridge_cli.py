"""
CLI bridge for Swasthya-Saathi symptom engine.
Reads JSON input from argv[1] and prints JSON output.
"""

import json
import sys

from symptom_checker import analyse


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing JSON payload"}))
        return 1

    try:
        payload = json.loads(sys.argv[1])
        result = analyse(payload)
        print(json.dumps(result))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
