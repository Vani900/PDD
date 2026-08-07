import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_p3():
    print('==================================================')
    print('PHASE 3 LIVE APPLICATION & SQL VERIFICATION')
    print('==================================================')

    test_email = f'live_user_mgmt_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1. Register user
    print('\n[1/7] Registering new user for Phase 3 User Management...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'Profile',
            'last_name': 'Tester',
            'email': test_email,
            'password': test_pass
        })
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']

        # Activate user
        await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})

        # Login
        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. GET /me & completion percentage
        print('\n[2/7] Testing GET /api/v1/users/me & completion percentage...')
        me_res = await client.get('/api/v1/users/me', headers=headers)
        assert me_res.status_code == 200
        me = me_res.json()
        print('User Profile -> Email:', me['email'], '| Completion %:', me['completion_percentage'])
        assert me['completion_percentage'] > 0

        # 3. PUT /me (Edit profile & address)
        print('\n[3/7] Updating Profile & Address via PUT /api/v1/users/me...')
        edit_res = await client.put('/api/v1/users/me', json={
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'bio': 'Supporting education & food drives',
            'address_line1': '100 Indiranagar 100ft Rd',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'country': 'India',
            'postal_code': '560038'
        }, headers=headers)
        assert edit_res.status_code == 200
        print('Profile Update Response:', edit_res.json())

        # 4. Avatar update
        print('\n[4/7] Testing POST /api/v1/users/avatar...')
        av_res = await client.post('/api/v1/users/avatar', json={'avatar_url': 'https://storage.charityai.org/avatars/test.png'}, headers=headers)
        assert av_res.status_code == 200
        print('Avatar Update Response:', av_res.json())

        # 5. Preferences update
        print('\n[5/7] Testing PUT /api/v1/users/preferences...')
        pref_res = await client.put('/api/v1/users/preferences', json={
            'email_notifications': True,
            'push_notifications': False,
            'sms_notifications': True,
            'public_profile': True
        }, headers=headers)
        assert pref_res.status_code == 200
        print('Preferences Response:', pref_res.json())

        # 6. Activity log retrieval
        print('\n[6/7] Testing GET /api/v1/users/activity...')
        act_res = await client.get('/api/v1/users/activity', headers=headers)
        assert act_res.status_code == 200
        print('Activity Logs Total Count:', act_res.json()['total'])
        assert act_res.json()['total'] >= 1

    # 7. SQL Database Persistence Verification
    print('\n[7/7] Verifying SQL records directly in PostgreSQL...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    p_row = await conn.fetchrow('SELECT first_name, last_name, city, country, avatar_url FROM user_profiles WHERE user_id = $1', uuid.UUID(user_id))
    assert p_row is not None
    print('SQL user_profiles -> Name:', f"{p_row['first_name']} {p_row['last_name']}", '| City:', p_row['city'], '| Country:', p_row['country'])
    assert p_row['first_name'] == 'UpdatedFirst'
    assert p_row['city'] == 'Bangalore'

    audit_count = await conn.fetchval('SELECT count(*) FROM audit_logs WHERE user_id = $1', uuid.UUID(user_id))
    print('SQL audit_logs Count:', audit_count)
    assert audit_count >= 1

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 3 USER MANAGEMENT VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_p3())
