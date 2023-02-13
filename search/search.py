import meilisearch

client = meilisearch.Client('https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io', '117c691a34b21a6651798479ebffd181eb276958')

result = index.search('caorl')

print(result)