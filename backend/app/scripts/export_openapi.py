import argparse
import json
from pathlib import Path

from app.main import app


def export_openapi(output_path: Path) -> None:
    openapi_schema = app.openapi()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    print(f"OpenAPI schema successfully exported to: {output_path.resolve()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export FastAPI OpenAPI JSON schema")
    default_out = Path(__file__).resolve().parent.parent.parent.parent / "openapi.json"
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=default_out,
        help="Path where openapi.json will be saved",
    )
    args = parser.parse_args()
    export_openapi(args.output)
