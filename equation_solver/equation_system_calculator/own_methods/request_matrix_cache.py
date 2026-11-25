import hashlib


def legacy_matrix_cache_key(request):
    """Scope the old two-request API flow to its client CSRF token."""
    csrf_token = request.META.get("HTTP_X_CSRFTOKEN")
    if not csrf_token:
        return None

    token_hash = hashlib.sha256(csrf_token.encode("utf-8")).hexdigest()
    return f"legacy-matrix:{token_hash}"
