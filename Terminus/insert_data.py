import csv
from itertools import islice
from schema import ImpactArea, Blockchain, Topic, Web3, Organization
from terminusdb_client import WOQLClient
from datetime import datetime
import pytz
import re
import emoji
import json
import meilisearch
import ast
import hashlib


# we keep all the information in dictionaries with Employee id as keys
orgs = {}
orgsjson = []

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="play", team="Myseelia", use_token=True)

client1 = meilisearch.Client(
    'https://ms-9ea4a96f02a8-1969.sfo.meilisearch.io', '117c691a34b21a6651798479ebffd181eb276958')

index = client1.index('orgs')

def get_emoji_regexp():
    # Sort emoji by length to make sure multi-character emojis are
    # matched first
    emojis = sorted(emoji.EMOJI_DATA, key=len, reverse=True)
    pattern = u'(' + u'|'.join(re.escape(u) for u in emojis) + u')'
    return re.compile(pattern)


def remove_emojis(string):
    return get_emoji_regexp().sub(r'', string)

def hash_string(string):
    sha256 = hashlib.sha256()
    sha256.update(string.encode('utf-8'))
    return sha256.hexdigest()

def to_json(obj):
    obj_dict = obj.__dict__
    if obj_dict['blockchainecosystem']:
        print(obj_dict['blockchainecosystem'])
        obj_dict['blockchainecosystem'] = [
            bc.name for bc in obj_dict['blockchainecosystem']]
    else:
        obj_dict['web3'] = None
    if obj_dict['impactarea']:
        print(obj_dict['impactarea'])
        obj_dict['impactarea'] = [ia.name for ia in obj_dict['impactarea']]
    else:
        obj_dict['web3'] = None
    if obj_dict['topic']:
        print(obj_dict['topic'])
        obj_dict['topic'] = [t.name for t in obj_dict['topic']]
    else:
        obj_dict['web3'] = None
    if obj_dict['web3']:
        print(obj_dict['web3'])
        obj_dict['web3'] = [w.name for w in obj_dict['web3']]
    else:
        obj_dict['web3'] = None
    print(obj_dict['datecreated'])
    obj_dict['datecreated'] = obj_dict['datecreated'].isoformat()
    print("here")
    print("here" + json.dumps(obj_dict))
    return json.dumps(obj_dict)


with open("Organizations.csv") as file:
    csv_file = csv.reader(file)
    next(csv_file)  # skiping header
    chunk_size = 1000
    while True:
        chunk = list(islice(csv_file, chunk_size))
        if not chunk:
            break
        # Process the chunk of rows here
        counter = 0
        for row in chunk:
            row = [remove_emojis(cell) for cell in row]
            assignee = row[0]
            impactArea = row[4].strip("{}").split(",")
            impact_area_set = set()
            for value in impactArea:
                if value:
                    value = value.strip().strip('"')
                    if value == "Social justice":
                        impact_area_set.add(ImpactArea.SocialJustice)
                    elif value in ("Food & Agriculture", "Food & Ag."):
                        impact_area_set.add(ImpactArea.FoodAg)
                    elif value == "Invest":
                        impact_area_set.add(ImpactArea.Politicsactivism)
                    elif value == "Politics & activism":
                        impact_area_set.add(ImpactArea.Investing)
                    elif value == "Innovate":
                        impact_area_set.add(ImpactArea.Innovation)
                    else:
                        impact_area_set.add(ImpactArea[value])
            blockchainEcosystem = row[1].strip("{}").split(",")
            blockchainEcosystem_set = set()
            for value in blockchainEcosystem:
                if value:
                    blockchain = value.strip()
                    if blockchain == "Binance Smart Chain":
                        blockchain = Blockchain.BinanceSmartChain
                    elif blockchain == "Regen Network":
                        blockchain = Blockchain.RegenNetwork
                    elif blockchain == "Energy Web Chain":
                        blockchain = Blockchain.EnergyWebChain
                    elif blockchain == "Hyperledger Fabric":
                        blockchain = Blockchain.HyperledgerFabric
                    elif blockchain == "Zero Carbon":
                        blockchain = Blockchain.ZeroCarbon
                    elif blockchain == "IXO":
                        blockchain = Blockchain.ixo
                    elif blockchain in ("Not found", "Not sure / still deciding"):
                        blockchain = Blockchain.Other
                    elif blockchain == "Not applicable":
                        break
                    else:
                        blockchain = Blockchain[blockchain]
                    blockchainEcosystem_set.add(blockchain)
            web3 = row[15].strip("{}")
            web3_set = set()
            for value in re.split(",(?![^(]*\))", web3):
                if value:
                    web3 = value.strip().strip('"')
                    # someone put "Blockchain (L1,DAO" which will match to "Blockchain (L1" since we strip the '"'
                    if web3 in ("Blockchain (L1, L2)", "Blockchain (L1,L2)", "Blockchain (L1"):
                        web3 = Web3.Blockchain
                    else:
                        web3 = Web3[web3]
                    web3_set.add(web3)
            topic = row[13].strip("{}").split(",")
            topic_set = set()
            for value in topic:
                if value:
                    topic = value.strip()
                    if topic == "inclusion and equality":
                        topic = Topic.inclusionequality
                    elif topic == "Circular Economy":
                        topic = Topic.CircularEconomy
                    elif topic == "Financial Inclusion":
                        topic = Topic.Financial_Inclusion
                    elif topic == "origin & trace":
                        topic = Topic.Traceability
                    elif topic == "Supply Chain":
                        topic = Topic.SupplyChain
                    elif topic == "Move-to-earn":
                        topic = Topic.Movetoearn
                    elif topic == "Work & Business":
                        topic = Topic.Work
                    elif topic == "Food Forests":
                        topic = Topic.FoodForests
                    elif topic == "Eco-Living":
                        topic = Topic.EcoLiving
                    else:
                        topic = Topic[topic]
                    topic_set.add(topic)
            date_string = row[2]
            utc_date = datetime.min
            if date_string:
                date_format = "%m/%d/%Y %I:%M %p"
                parsed_date = datetime.strptime(date_string, date_format)
                # Convert the datetime object to UTC time
                utc_date = pytz.utc.normalize(pytz.utc.localize(parsed_date))
            preJan20thUpvotesstr = row[7]
            preJan20thUpvotesint = 0
            if preJan20thUpvotesstr.isdigit():
                preJan20thUpvotesint = int(preJan20thUpvotesstr)
            upvotesstr = row[7]
            upvotesint = 0
            if upvotesstr.isdigit():
                upvotesint = int(upvotesstr)

            org = Organization(
                assignee=row[0] if row[0] not in [None, ''] else None,
                blockchainecosystem=blockchainEcosystem_set if len(
                    blockchainEcosystem_set) > 0 else None,
                description=row[3] if row[3] not in [None, ''] else None,
                logo=row[5] if row[5] not in [None, ''] else None,
                # name is the only mandatory field, so default it to "" if blank
                name=row[6] if row[6] not in [None, ''] else "",
                preJan20thUpvotes=preJan20thUpvotesint if preJan20thUpvotesint not in [
                    0] else None,
                reviewed=row[8] if row[3] not in [None, ''] else None,
                submittedbyemail=row[9] if row[9] not in [None, ''] else None,
                submittedbyname=row[10] if row[10] not in [None, ''] else None,
                submittedbyowner=row[11] if row[11] not in [
                    None, ''] else None,
                subscribed=row[12] if row[12] not in [None, ''] else None,
                topic=topic_set if len(topic_set) > 0 else None,
                upvotes=upvotesint if upvotesint not in [0] else None,
                web3=web3_set if len(web3_set) > 0 else None,
                impactarea=impact_area_set if len(
                    impact_area_set) > 0 else None,
                datecreated=utc_date if impact_area_set not in [
                    datetime.min] else None,
            )

            orgs[counter] = org
           # print(to_json(org))
           # orgsjson.append(to_json(org))
            counter += 1
        inserted = client.insert_document(
            list(orgs.values()), commit_msg="Adding orgs")
        documents = []
        for id in inserted:
            document = client.get_document(id)
            real_id = document['@id']
            num_id = real_id.split("/")[-1]
            document = {k: json.dumps(v) for k, v in document.items() if k != '@id'}
            document.update({'id': num_id})
            documents.append(document)
        index.add_documents(documents)
