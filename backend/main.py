from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
import pymongo
from urllib.parse import quote_plus as quote
import os

user = os.environ["MONGO_USER"]
password = os.environ["MONGO_PASSWORD"]
host = os.environ["MONGO_HOST"]
replica_set = os.environ["MONGO_RS"]
auth_src = os.environ["AUTH_SRC"]
cert_path = os.environ["CERT_PATH"]
port = os.environ["PORT"]

url = 'mongodb://{user}:{pw}@{hosts}/?replicaSet={rs}&authSource={auth_src}'.format(
    user=quote(user),
    pw=quote(password),
    hosts=','.join([
        host
    ]),
    rs=replica_set,
    auth_src=auth_src)
mydb = pymongo.MongoClient(
    url,
    tls=True,
    tlsCAFile=cert_path)['urban-view']
mycol = mydb["distances"]

# '/root/.mongodb/root.crt'

app = FastAPI()

class Item(BaseModel):
    id: str
    lon: str
    lat: str
    dist: str

def serialize_item(item) -> Item:
    return Item(
        id=str(item["_id"]),
        lon=item["lon"],
        lat=item["lat"],
        dist=item["dist"]
    )


@app.get("/get_distances", response_model=List[Item])
async def get_distances():
    items = mycol.find()
    return [serialize_item(item) for item in items]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=port)