from django.urls import path
from .views import EquationSolver

urlpatterns = [
    path('solve/', EquationSolver.as_view(), name='solve_equations'),
]