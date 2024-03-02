
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from ..serializers import EquationSystemSerializer
from django.core.cache import cache

class AnotherPostView(APIView):

    def post(self, request, format=None):
        datal = request.data
        print('data in python = ', datal, ' ', request.data)
        #print('request post status -', request.data.status_code)
        degree = request.data.get('degree', 0)
        if degree is not None:
            cache.set('degree', degree, timeout=3600)  # Store degree for 1 hour
        return Response({'solution':degree}, status=200)