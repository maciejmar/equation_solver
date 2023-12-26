from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import EquationSystemSerializer
from django.http import HttpResponse
import numpy as np

class EquationSolver(APIView):
    def post(self, request, format=None):
        serializer = EquationSystemSerializer(data=request.data)
        if serializer.is_valid():
            coefficients = serializer.validated_data['coefficients']
            solution = self.solve_equations(coefficients)
            return Response({'solution': solution.tolist()})
        return Response(serializer.errors, status=400)

    def solve_equations(self, coefficients):
        # Your equation solving logic using NumPy
        return HttpResponse("Hello, world. We are in views.py")
        pass