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
    #check the solution
    
    # Check the solution by computing A * solution
    check_solution = np.dot(coefficients, solutions)

    # Print the solution
    print("Solution:", solutions)
    # Verify the solution against the original constants vector b
    # Using np.allclose() to account for possible floating-point arithmetic issues
    if np.allclose(check_solution, ordinates):
        print("The solution is correct. A * solution closely matches b.")
    else:
        print("There's a discrepancy in the solution.")
    return solutions