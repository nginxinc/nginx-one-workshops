FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy script and CSV file
COPY xc_api_script.py /app/

# Install dependencies
RUN pip install requests

# Set entrypoint
CMD ["python", "/app/xc_api_script.py"]