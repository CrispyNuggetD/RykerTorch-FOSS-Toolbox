import json
from pathlib import Path
import subprocess
import sys
import unittest

SCRIPT=Path(__file__).with_name('profile_to_scene.py')
class Adapter(unittest.TestCase):
    def run_adapter(self,login='hnah'):
        profile={'login':login,'email':'private@example.invalid','access_token':'never-publish','campus_users':[{'campus_id':64}],
                 'cursus_users':[{'cursus_id':21,'blackholed_at':'2027-01-18T02:42:00Z','begin_at':'2025-11-17T02:42:00Z'}]}
        return subprocess.run([sys.executable,str(SCRIPT),'--login','hnah','--gender','male'],input=json.dumps(profile),text=True,capture_output=True)
    def test_only_explicit_owner_scene_fields_are_exported(self):
        result=self.run_adapter();self.assertEqual(result.returncode,0)
        data=json.loads(result.stdout)
        self.assertEqual(set(data),{'login','profileUrl','deadline','start','observedAt','gender'})
        self.assertEqual(data['gender'],'male');self.assertNotIn('private',result.stdout)
        self.assertNotIn('access_token',result.stdout)
    def test_wrong_owner_is_refused(self):
        result=self.run_adapter('someone-else');self.assertNotEqual(result.returncode,0);self.assertFalse(result.stdout)
if __name__=='__main__':unittest.main()
