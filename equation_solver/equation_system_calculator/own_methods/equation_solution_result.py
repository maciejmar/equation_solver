import numpy as np

def equation_result(coefficients, ordinates):
    try:
        matrix = np.asarray(coefficients, dtype=float)
        vector = np.asarray(ordinates, dtype=float)
    except (TypeError, ValueError) as exc:
        raise ValueError("Matrix and ordinates must contain numeric values") from exc

    if matrix.ndim != 2 or matrix.shape[0] == 0 or matrix.shape[0] != matrix.shape[1]:
        raise ValueError("Matrix must be a non-empty square matrix")
    if vector.ndim != 1 or vector.size != matrix.shape[0]:
        raise ValueError("Ordinates must contain one value per matrix row")
    if not np.isfinite(matrix).all() or not np.isfinite(vector).all():
        raise ValueError("Matrix and ordinates must contain finite values")

    return np.linalg.solve(matrix, vector)