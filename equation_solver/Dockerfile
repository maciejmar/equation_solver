# Use an official Python runtime as a base image
FROM python:3.8-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBUG 0  # Ensure debug mode is off in production

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the project files into the container
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput
RUN chmod -R 755 /app/static
ENV PORT=8001
# Run gunicorn server
CMD gunicorn equation_solver.wsgi:application --bind 0.0.0.0:$PORT --timeout 120
