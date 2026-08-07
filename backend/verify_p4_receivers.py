import asyncio
import httpx
import asyncpg
import uuid

async def live_verify_receivers():
    print('==================================================')
    print('PHASE 4 RECEIVER SYSTEM LIVE & SQL VERIFICATION')
    print('==================================================')

    test_email = f'live_rec_{uuid.uuid4().hex[:6]}@charityai.org'
    test_pass = 'Password123!'

    # 1. Register & login receiver
    print('\n[1/6] Registering & logging in new Receiver...')
    async with httpx.AsyncClient(base_url='http://localhost:8000') as client:
        reg_res = await client.post('/api/v1/auth/register', json={
            'first_name': 'LiveRec',
            'last_name': 'Tester',
            'email': test_email,
            'password': test_pass,
            'role': 'receiver'
        })
        assert reg_res.status_code == 201
        user_id = reg_res.json()['user_id']
        await client.post('/api/v1/auth/verify-email', json={'user_id': user_id, 'otp_code': '123456'})

        login_res = await client.post('/api/v1/auth/login', json={'email': test_email, 'password': test_pass})
        assert login_res.status_code == 200
        token = login_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Create Receiver Profile with AI Priority Scoring
        print('\n[2/6] Creating Receiver Profile via POST /api/v1/receivers/profile...')
        prof_res = await client.post('/api/v1/receivers/profile', json={
            'family_size': 6,
            'monthly_income': 3000.0,
            'income_category': 'below_poverty_line',
            'housing_status': 'temporary_shelter'
        }, headers=headers)
        assert prof_res.status_code == 201
        ai_score = prof_res.json()['ai_priority_score']
        print('Profile Created! AI Priority Score:', ai_score)
        assert ai_score >= 80.0

        # 3. Create Help Request
        print('\n[3/6] Submitting Help Request via POST /api/v1/receivers/help-requests...')
        req_res = await client.post('/api/v1/receivers/help-requests', json={
            'need_type': 'food',
            'title': 'Urgent Family Meal Relief',
            'description': 'Family of 6 requiring emergency ration kit',
            'urgency_level': 'critical',
            "quantity_needed": "1 ration kit"
        }, headers=headers)
        assert req_res.status_code == 201
        request_id = req_res.json()['request_id']
        print('Help Request Created -> ID:', request_id)

        # 4. Approve Help Request
        print('\n[4/6] Approving Help Request via PATCH /api/v1/receivers/help-requests/{id}/approve...')
        appr_res = await client.patch(f'/api/v1/receivers/help-requests/{request_id}/approve', json={'action': 'approve'}, headers=headers)
        assert appr_res.status_code == 200
        print('Request Status:', appr_res.json()['status'])

        # 5. Create donation & match request
        print('\n[5/6] Matching Help Request with Donation...')
        donor_login = await client.post('/api/v1/auth/login', json={'email': 'donor@test.com', 'password': 'Donor@123456'})
        donor_headers = {'Authorization': f"Bearer {donor_login.json()['access_token']}"}
        don_res = await client.post('/api/v1/donations', json={
            'donation_type': 'food',
            'title': 'Live Receiver Match Pack',
            'amount': 2000.0
        }, headers=donor_headers)
        donation_id = don_res.json()['donation_id']

        match_res = await client.post(f'/api/v1/receivers/help-requests/{request_id}/match', json={'donation_id': donation_id}, headers=headers)
        assert match_res.status_code == 200
        print('Match Response:', match_res.json())

        # Confirm Delivery
        conf_res = await client.post(f'/api/v1/receivers/help-requests/{request_id}/confirm-delivery', headers=headers)
        assert conf_res.status_code == 200
        print('Fulfillment Response:', conf_res.json())

    # 6. Direct PostgreSQL Verification
    print('\n[6/6] Verifying SQL records in PostgreSQL (receiver_profiles, help_requests)...')
    conn = await asyncpg.connect('postgresql://charityai_user:charityai_pass_2026@127.0.0.1:5432/charityai')
    p_row = await conn.fetchrow('SELECT id, family_size, ai_priority_score FROM receiver_profiles WHERE user_id = $1', uuid.UUID(user_id))
    assert p_row is not None
    print('SQL receiver_profiles -> Family Size:', p_row['family_size'], '| AI Score:', p_row['ai_priority_score'])

    hr_row = await conn.fetchrow('SELECT id, status, matched_donation_id FROM help_requests WHERE id = $1', uuid.UUID(request_id))
    assert hr_row is not None
    print('SQL help_requests -> Status:', hr_row['status'], '| Matched Donation:', str(hr_row['matched_donation_id']))
    assert hr_row['status'] == 'fulfilled'

    await conn.close()
    print('\n==================================================')
    print('SUCCESS: ALL PHASE 4 RECEIVER SYSTEM VERIFICATIONS PASSED!')
    print('==================================================')

if __name__ == '__main__':
    asyncio.run(live_verify_receivers())
