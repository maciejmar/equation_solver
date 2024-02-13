
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from ..serializers import EquationSystemSerializer


class AnotherPostView(APIView):

    def post(self, request, format=None):
        datal = request.data
        print('data in python = ', datal, ' ', request.data)
        #print('request post status -', request.data.status_code)
        degree = request.data.get('degree', 0)
        
        return Response({'solution':degree}, status=200)