FROM python:3.11-slim

WORKDIR /app

COPY offline/requirements.txt ./offline/requirements.txt
RUN pip install --no-cache-dir -r offline/requirements.txt

COPY offline ./offline

CMD ["python", "-m", "offline.src.main"]