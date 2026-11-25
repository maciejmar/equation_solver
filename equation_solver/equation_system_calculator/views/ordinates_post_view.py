from rest_framework.views import APIView
from rest_framework.response import Response
from ..own_methods.equation_solution_result import equation_result
from ..own_methods.request_matrix_cache import legacy_matrix_cache_key
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from numpy.linalg import LinAlgError
import re

class OrdinatesPostView(APIView):
    @csrf_exempt
    def post(self, request, format=None):
        data = request.data
        matrix = data.get('matrix')
        ordinates = data.get('ordinates')

        if matrix is None:
            cache_key = legacy_matrix_cache_key(request)
            matrix = cache.get(cache_key) if cache_key else None

        if ordinates is None:
            ordinate_keys = sorted(
                (key for key in data if re.fullmatch(r'ordin\d+', str(key))),
                key=lambda key: int(str(key)[5:]),
            )
            ordinates = [data[key] for key in ordinate_keys]

        if matrix is None or not ordinates:
            return Response(
                {'error': 'Matrix and ordinates are required'},
                status=400,
            )

        try:
            solution = equation_result(matrix, ordinates)
        except LinAlgError:
            return Response(
                {'error': 'Matrix is singular, cannot proceed'},
                status=400,
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)

        return Response({'solution': solution.tolist()})
