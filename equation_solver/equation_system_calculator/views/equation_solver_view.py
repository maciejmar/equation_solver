from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from ..serializers import EquationSystemSerializer
from ..own_methods.solvation import perform_calculation
import numpy as np
from ..own_methods.equation_solution_result import equation_result
from django.core.cache import cache
from numpy.linalg import LinAlgError

# def post(self, request, format=None):
#         data = request.data
#         print('Received data:', data)
        
#         # Perform your logic here. Example:
#         degree = data.get('degree', 0)
#         solution = degree * 2  # Example logic

#         return Response({'solution': solution})
    
# Class-based view for POST request


class EquationSolver(APIView):
    
    def post(self, request, format=None):
      data = request.data
      print('Received matrix data:', data)

      # Reconstruct the matrix from the cell values
      size = 4  # Assuming a 4x4 matrix
      matrix = np.zeros((size, size))
      for i in range(size):
        for j in range(size):
            key = f'cell{i}_{j}'  # Define key for each cell
            value = data.get(key, '0')  # Get the value, default to '0' if key not found

            # Convert value to float, default to 0.0 if empty string or invalid
            try:
                matrix[i, j] = float(value)
            except ValueError:
                matrix[i, j] = 0.0
      try:
           det = np.linalg.det(matrix)
           if np.isclose(det, 0):
             print('this matrix is singular')  
             return Response({'error': 'Matrix is singular, cannot proceed'}, status=400)
      except LinAlgError as e:
            return Response({'error is now in except matrixSolver': str(e)}, status=400)  
        
      cache.set('matrix_data', matrix, timeout=300)  # Store matrix data for 5 minutes

      print('Constructed matrix:', matrix)
      #cache.set('matrix_data', matrix, timeout=300)

      m = cache.get('matrix_data')
      print('m in get of cache is:', m)
      return Response({'result': 'we are in equation_solver'})

        
class MatrixSolver(APIView):
    def post(self, request, format=None):
        data = request.data
        print('Received matrix data:', data)
        matrix = np.array(data.get('matrix'))
        try:
           det = np.linalg.det(matrix)
           if np.isclose(det, 0):
             print('this matrix is singular')  
             return Response({'error': 'Matrix is singular, cannot proceed'}, status=400)
        except LinAlgError as e:
            return Response({'error is now in except matrixSolver': str(e)}, status=400)  
        
        cache.set('matrix_data', matrix, timeout=300)  # Store matrix data for 5 minutes
        print('-------------------------------- matrix =' )
        return Response({'result': 'we are in equation_solver'})

class OrdinatesSolver(APIView):
    def post(self, request, format=None):
        data = request.data
        print('Received ordinates data:', data)
        ordinates = np.array(data.get('ordinates'))
        matrix = cache.get('matrix_data')  # Retrieve matrix data
        print('********************************')
        # Process ordinates data
        if matrix is not None:
            solution = equation_result(matrix, ordinates)
            print ('I solved the equation system ->',solution)
            return Response({'solution': solution})
        else:
            return Response({'error': 'Matrix data not found'}, status=400)
       
        
     

# Standalone function for GET request
def solve(request):
    # Your logic for 'solve'
    return HttpResponse("Response from solve")

def solve_equations(request):
    # Your logic for 'solve_equations'
    return HttpResponse("Response from solve_equations")
