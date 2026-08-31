import argparse
import json
from pathlib import Path

import pandas as pd

from .recommender import HybridUniversityRecommender, StudentProfile


def csv_values(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


def main() -> None:
    parser = argparse.ArgumentParser(description="Recommend universities for a student")
    parser.add_argument("--gre", type=float, required=True)
    parser.add_argument("--toefl", type=float, required=True)
    parser.add_argument("--sop", type=float, required=True)
    parser.add_argument("--lor", type=float, required=True)
    parser.add_argument("--gpa", type=float, required=True)
    parser.add_argument("--research", type=int, choices=(0, 1), required=True)
    parser.add_argument("--desired-rating", type=int, choices=range(1, 6), default=4)
    parser.add_argument("--regions", type=csv_values, default=())
    parser.add_argument("--countries", type=csv_values, default=())
    parser.add_argument("--strategy", choices=("balanced", "reach", "target", "safety", "all"), default="balanced")
    parser.add_argument("--top-k", type=int, default=10)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    profile = StudentProfile(
        gre_score=args.gre,
        toefl_score=args.toefl,
        sop=args.sop,
        lor=args.lor,
        gpa=args.gpa,
        research=args.research,
        desired_university_rating=args.desired_rating,
        preferred_regions=args.regions,
        preferred_countries=args.countries,
    )
    recommendations = HybridUniversityRecommender().recommend(
        profile, top_k=args.top_k, strategy=args.strategy
    )
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        if args.output.suffix.lower() == ".csv":
            pd.DataFrame(recommendations).to_csv(args.output, index=False)
        else:
            args.output.write_text(json.dumps(recommendations, indent=2), encoding="utf-8")
        print(f"Saved {len(recommendations)} recommendations to {args.output}")
    else:
        print(json.dumps(recommendations, indent=2))


if __name__ == "__main__":
    main()
