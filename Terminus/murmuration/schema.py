####
# This is the script for storing the schema of your TerminusDB
# database for your project.
# Use 'terminusdb commit' to commit changes to the database and
# use 'terminusdb sync' to change this file according to
# the exsisting database schema
####
"""
"""
from typing import Optional, Set

from terminusdb_client.woqlschema import (
    DocumentTemplate,
    ValueHashKey,
)


class person(DocumentTemplate):
    """person_schema-v0.1.0

    Attributes
    ----------
    LI : Set['person']
        knows
    vouches_for : Set['person']
        knows
    """

    _key = ValueHashKey()
    LI: Set["person"]
    description: Optional[str]
    image: Optional[str]
    locality: Optional[str]
    name: Optional[str]
    primary_url: Optional[str]
    vouches_for: Set["person"]

    def __str__(self):
        return f"person(name={self.name}, description={self.description}, primary_url={self.primary_url}, image={self.image}, locality={self.locality}, vouches_for={self.vouches_for}, LI={self.LI})"