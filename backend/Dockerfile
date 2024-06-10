FROM python:3.9.13

WORKDIR /app

COPY ./requirements.txt ./requirements.txt

RUN pip3 install --no-cache -r requirements.txt

COPY . .

RUN mkdir -p ~/.mongodb && \
wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" \
     --output-document ~/.mongodb/root.crt && \
chmod 0644 ~/.mongodb/root.crt

CMD ["python", "main.py"]
