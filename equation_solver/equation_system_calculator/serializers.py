from rest_framework import serializers

class EquationSystemSerializer(serializers.Serializer):
    # Define the serializer with fields that match the expected input
    coefficients = serializers.JSONField()

    def solve_equations(self, data):
        # Add your equation solving logic here
        pass