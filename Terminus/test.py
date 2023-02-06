import csv
from itertools import islice
from schema import ImpactArea, Blockchain, Topic, Web3, Organization
from terminusdb_client import WOQLClient
from datetime import datetime
import pytz
import re
import emoji

# we keep all the information in dictionaries with Employee id as keys
orgs = {}

client = WOQLClient("https://cloud.terminusdb.com/Myseelia/")
client.connect(db="playground3", team="Myseelia", use_token=True)

import re


orgs[0] = Organization(
    # assignee = "",
    # blockchainecosystem = set(),
    # description = "",
    # logo = "",
    name = "darren"
    # preJan20thUpvotes = 0,
    # reviewed = "",
    # submittedbyemail = "",
    # submittedbyname = "",
    # submittedbyowner = "",
    # subscribed = "",
    # topic = set(),
    # upvotes = 0,
    # web3 = set(),
    # impactarea = set(),
    # datecreated = datetime.min
)

client.insert_document(list(orgs.values()), commit_msg="Adding 4 orgs")


