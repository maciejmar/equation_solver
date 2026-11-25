from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIRequestFactory
import numpy as np

from .views.equation_solver_view import EquationSolver
from .views.ordinates_post_view import OrdinatesPostView


class StatelessMatrixTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_matrix_validation_does_not_store_matrix_in_shared_cache(self):
        request = self.factory.post(
            "/calculator/equation_solver/",
            {
                "cell0_0": 2,
                "cell0_1": 1,
                "cell1_0": 1,
                "cell1_1": -1,
            },
            format="json",
        )

        response = EquationSolver.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(cache.get("matrix_data"))

    def test_solver_uses_matrix_from_the_same_request(self):
        cache.set("matrix_data", np.array([[1.0, 1.0], [1.0, -1.0]]), timeout=300)
        request = self.factory.post(
            "/calculator/ordinates/",
            {
                "matrix": [[2.0, 1.0], [1.0, -1.0]],
                "ordin0": 5.0,
                "ordin1": 1.0,
            },
            format="json",
        )

        response = OrdinatesPostView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        np.testing.assert_allclose(response.data["solution"], [2.0, 1.0])
