####
# This is the script for storing the schema of your TerminusDB
# database for your project.
# Use 'terminusdb commit' to commit changes to the database and
# use 'terminusdb sync' to change this file according to
# the exsisting database schema
####
"""
Title: Phonebook for Awesome Startup
Description: Database storing all the contact details of all employees in Awesome Startup
Authors: Destiny Norris, Fabian Dalby
"""
from typing import List, Optional, Set

from terminusdb_client.woqlschema import DocumentTemplate, EnumTemplate, RandomKey
from datetime import datetime, time
class Blockchain(EnumTemplate):
    Ethereum = ()
    Polygon = ()
    Celo = ()
    Cosmos = ()
    Near = ()
    Hedera = ()
    Tezos = ()
    Cardano = ()
    Solana = ()
    BinanceSmartChain = ()
    Algorand = ()
    Bitcoin = ()
    RegenNetwork = ()
    EnergyWebChain = ()
    Chia = ()
    Polkadot = ()
    Kusama = ()
    HyperledgerFabric = ()
    Stellar = ()
    Gnosis = ()
    ixo = ()
    Juno = ()
    Avalanche = ()
    Optimism = ()
    Powerledger = ()
    EOS = ()
    VeChain = ()
    Fantom = ()
    Harmony = ()
    Arbitrum = ()
    Stargaze = ()
    IOTA = ()
    Chainlink = ()
    EverGreen = ()
    NANO = ()
    Other = ()
    Telos = ()
    XELS = ()
    ZeroCarbon = ()
    Topl = ()
    HBAR = ()
class Organization(DocumentTemplate):
    """

    Attributes
    ----------
    assignee : Optional[str]
        assignee
    blockchainecosystem : Optional[str]
        blockchain ecosystem
    datecreated : Optional[time]
        date created
    description : Optional[str]
        description
    impactarea : Set['ImpactArea']
        impact area
    logo : Optional[str]
        logo
    name : str
        name
    preJan20thUpvotes : Optional[int]
        preJan20thUpvotes
    reviewed : Optional[str]
        reviewed
    submittedbyemail : Optional[str]
        submitted by (email)
    submittedbyname : Optional[str]
        submitted by (name)
    submittedbyowner : Optional[str]
        submitted by (owner)
    topic : Optional['Topic']
        topic
    upvotes : Optional[int]
        upvotes
    web3 : Optional['Web3']
        web3 
    """
    _key = RandomKey()
    assignee:Optional[str]
    blockchainecosystem:Set['Blockchain']
    datecreated:Optional[datetime]
    description:Optional[str]
    impactarea:Set['ImpactArea']
    logo:Optional[str]
    name:str
    preJan20thUpvotes:Optional[int]
    reviewed:Optional[str]
    submittedbyemail:Optional[str]
    submittedbyname:Optional[str]
    submittedbyowner:Optional[str]
    subscribed:Optional[str]
    topic:Set['Topic']
    upvotes:Optional[int]
    web3:Set['Web3']
class Web3(EnumTemplate):
    Blockchain = ()
    dApp = ()
    Token = ()
    NFT = ()
    DAO = ()
    Wallet = ()
    Exchange = ()
    Metaverse = ()
    Oracle = ()
    Infrastructure = ()
    Education = ()
    Stablecoin = ()
    Identity = ()
    Validator = ()
    Community = ()
    Solutions = ()
    DeFi = ()
    Marketplace = ()
    Bridge = ()
    DEX = ()
    Other = ()
class ImpactArea(EnumTemplate):
    SocialJustice = ()
    Carbon = ()
    Energy = ()
    Nature = ()
    Investing = ()
    Industry = ()
    Social_Justice = ()
    Social = ()
    Infrastructure = ()
    FoodAg = ()
    Politicsactivism = ()
    Innovation = ()
    Education = ()
    Health = ()
    Other = ()
class Topic(EnumTemplate):
    Gaming = ()
    Marketplace = ()
    Art = ()
    Initiative = ()
    Fundraising = ()
    Legal = ()
    Media = ()
    Charity = ()
    Identity = ()
    Currency = ()
    Local = ()
    Biodiversity = ()
    Water = ()
    Ocean = ()
    Land = ()
    Renewables = ()
    MRV = ()
    Finance = ()
    Offsetting = ()
    Accounting = ()
    Data = ()
    Commodities = ()
    Payments = ()
    VC = ()
    Mining = ()
    Movetoearn = ()
    Recycling = ()
    Governance = ()
    Women = ()
    Work = ()
    Space = ()
    Traceability = ()
    Affordability = ()
    Reforestation = ()
    DeSci = ()
    Financial_Inclusion = ()
    Investing = ()
    AI = ()
    Community = ()
    Consulting = ()
    Reward = ()
    inclusionequality = ()
    CircularEconomy = ()
    SupplyChain = ()
    Trading = ()
    Animals = ()
    Forestry = ()
    FoodForests = ()
    Agriculture = ()
    Staking = ()
    Fitness = ()
    waste = ()
    Medicine = ()
    Loneliness = ()
    UBI = ()
    Energy = ()
    Meteorology = ()
    Other = ()
    IoT = ()
    EcoLiving = ()
