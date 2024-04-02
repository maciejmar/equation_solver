from rest_framework.views import APIView
from rest_framework.response import Response
from ..own_methods.equation_solution_result import equation_result
from django.core.cache import cache
import numpy as np
from django.views.decorators.csrf import csrf_exempt

class OrdinatesPostView(APIView):
    @csrf_exempt    
    def post(self, request, format=None):
        data = request.data
        print('Received ordinates data:', data)
        # Process ordinates data
        # ...
        print ('now I try too print cached matrix')
        #ordinates = np.array(data.get('ordinates'))
        ordinates_list = [data[key] for key in sorted(data.keys()) if key.startswith('ordin')]
        ordinates = np.array(ordinates_list)
 
        # Retrieve matrix data from cache
        matrix = cache.get('matrix_data')
        
        matrix = cache.get('matrix_data')  # Retrieve matrix data
        print('matrtix in the ordinates is ', matrix)
        print('ordinates are ', ordinates)
        if matrix is not None:
                solution = equation_result(matrix, ordinates)
                print ('I solved the equation system ->',solution)
                return Response({'solution': solution})
        else:
                return Response({'error': 'Matrix data not found'}, status=400)
