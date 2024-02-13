# from django.urls import path
# from .views.equation_solver_view import EquationSolver, solve, solve_equations
# from .views.another_post_view import AnotherPostView

# urlpatterns = [
    
#     path('equation_solver/', EquationSolver.as_view(), name='equation_solver'),
#     #path('solve_equations/', solve_equations, name='solve_equations'),
#     path('solve/', solve, name='solve'),
    
    
#     path('another_post/', AnotherPostView.as_view(), name='another_post'),
    

    
# ]

from django.urls import path
from .views.equation_solver_view import EquationSolver, solve, solve_equations
from .views.another_post_view import AnotherPostView
from .views.ordinates_post_view import OrdinatesPostView

urlpatterns = [
    path('equation_solver/', EquationSolver.as_view(), name='equation_solver'),
    path('solve/', solve, name='solve'),
    path('solve_equations/', solve_equations, name='solve_equations'),
    path('another_post/', AnotherPostView.as_view(), name='another_post'),
    path('ordinates/', OrdinatesPostView.as_view(), name='ordinates_post')
]