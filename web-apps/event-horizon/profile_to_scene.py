#!/usr/bin/env python3
"""Turn an already-authorized OWN 42 profile on stdin into a minimal public scene config.
No network access, keys, raw profile persistence or scheduling.
"""
import argparse
from datetime import datetime,timezone
import json
import sys
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--login',required=True,help='Expected owner login; refuse another account')
parser.add_argument('--gender',choices=['neutral','male','female'],default='neutral')
args=parser.parse_args();profile=json.load(sys.stdin)
if profile.get('login')!=args.login:parser.error('Profile does not match the expected owner')
if not any(c.get('campus_id')==64 for c in profile.get('campus_users',[])):parser.error('Expected a Singapore owner profile')
cursus=next((c for c in profile.get('cursus_users',[]) if c.get('cursus_id')==21),{})
print(json.dumps(dict(login=args.login,profileUrl='https://profile.intra.42.fr/users/'+args.login,deadline=cursus.get('blackholed_at'),start=cursus.get('begin_at'),observedAt=datetime.now(timezone.utc).isoformat(),gender=args.gender),indent=2))
