import diskcache
import hashlib
import json
import os

cache = diskcache.Cache("./cache/disk")
TTL = 86400  # 24 hours

def cache_key(address: str) -> str:
    return "rec_" + hashlib.md5(address.lower().strip().encode()).hexdigest()

def get_cached(address: str) -> dict | None:
    return cache.get(cache_key(address))

def set_cached(address: str, data: dict) -> None:
    cache.set(cache_key(address), data, expire=TTL)
