import numpy as np

# Example coefficient matrix (3x3)

coefficients = np.array([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2]
])

# Example ordinates (right-hand side of equations)
# ordinates = np.array([8, -11, -3])

# Solving the system
def equation_result(coefficients, ordinates): 
    try:
        solutions = np.linalg.solve(coefficients, ordinates)
    except np.linalg.LinAlgError as e:
        # Handle errors (e.g., singular matrix)
        solutions = str(e)
    return solutions