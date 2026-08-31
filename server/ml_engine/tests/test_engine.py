from ml_engine.data import rank_midpoint, rank_to_rating
from ml_engine.recommender import HybridUniversityRecommender, StudentProfile


def test_rank_parsing_and_rating():
    assert rank_midpoint("1201-1400") == 1300.5
    assert rank_midpoint("=42") == 42
    assert rank_to_rating(42) == 5
    assert rank_to_rating(1300) == 1


def test_recommendations_have_expected_shape():
    engine = HybridUniversityRecommender()
    profile = StudentProfile(325, 112, 4.0, 4.0, 3.7, 1, 4, ("Europe",), ())
    recommendations = engine.recommend(profile, top_k=6, strategy="all")
    assert len(recommendations) == 6
    assert recommendations[0]["hybrid_score"] >= recommendations[-1]["hybrid_score"]
    assert all(0 <= row["selectivity_adjusted_fit"] <= 1 for row in recommendations)


def test_elite_school_is_not_called_safety_from_raw_ann_score():
    engine = HybridUniversityRecommender()
    profile = StudentProfile(325, 112, 4.0, 4.0, 3.7, 1, 4)
    recommendations = engine.recommend(profile, top_k=len(engine.universities), strategy="all")
    mit = next(row for row in recommendations if row["university"].strip() == "Massachusetts Institute of Technology (MIT)")
    assert mit["category"] == "reach"
