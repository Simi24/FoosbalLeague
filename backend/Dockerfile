FROM arm64v8/python:3.12-slim AS base

RUN apt-get update && apt-get install -y curl

ENV LAMBDA_TASK_ROOT=/var/task
ENV PYTHONPATH=$LAMBDA_TASK_ROOT
RUN mkdir -p $LAMBDA_TASK_ROOT
WORKDIR $LAMBDA_TASK_ROOT

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


FROM base AS dev
RUN pip install debugpy

RUN curl -Lo /usr/local/bin/aws-lambda-rie \
    https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie && \
    chmod +x /usr/local/bin/aws-lambda-rie;

COPY ./app .
EXPOSE 5678

CMD ["/usr/local/bin/aws-lambda-rie", "/usr/local/bin/python", "-m", "debugpy", \
     "--listen", "0.0.0.0:5678", "--wait-for-client", "-m", "awslambdaric", "main.lambda_handler"]


FROM base AS prod
COPY ./app .
RUN mkdir -p /app/logs

CMD ["/usr/local/bin/python", "-m", "awslambdaric", "main.lambda_handler"]
