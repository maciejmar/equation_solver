"""
URL configuration for equation_solver project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import include, path

from equation_system_calculator.views.equation_solver_view import solve, solve_equations
from equation_system_calculator.views.equation_solver_view import EquationSolver
from equation_system_calculator.views.another_post_view  import AnotherPostView
from equation_system_calculator.views.ordinates_post_view import OrdinatesPostView
from django.urls import include, path

urlpatterns = [
# Include app-level URLs
    #path('calculator/', include('equation_system_calculator.urls')),
    # path('calculator/solve/', solve),
    # path('calculator/solve_equations/', solve_equations),
    #include('equation_system_calculator.urls'),
    #path('equation_solver/', EquationSolver.as_view(), name='equation_solver'),
    path('another_post/', AnotherPostView.as_view(), name='another_post'),
    path('calculator/', include('equation_system_calculator.urls')), 
    path('equation_solver/', EquationSolver.as_view(), name='equation_solver'),
    path('ordinates/', OrdinatesPostView.as_view(), name='ordinates')
]




