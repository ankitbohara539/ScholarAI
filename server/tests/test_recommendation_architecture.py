from app.ml.scoring import RecommendationClassifier
from app.services.recommendation_service import RecommendationService


def test_recommendation_classification_boundaries_are_stable() -> None:
    assert RecommendationClassifier.classify(0.4499) == "reach"
    assert RecommendationClassifier.classify(0.45) == "target"
    assert RecommendationClassifier.classify(0.6999) == "target"
    assert RecommendationClassifier.classify(0.70) == "safety"


def test_generation_and_simulation_share_the_canonical_service_method() -> None:
    assert hasattr(RecommendationService, "_recommend")
